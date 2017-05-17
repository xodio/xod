import R from 'ramda';
import path from 'path';
import fs from 'fs';
import EventEmitter from 'events';

import * as XP from 'xod-project';
import {
  resolvePath,
  writeFile,
  copy,
  save,
  getLocalProjects,
  doesDirectoryExist,
  doesFileExist,
  loadProjectWithLibs,
  pack,
  arrangeByFiles,
} from 'xod-fs';
import {
  notEmpty,
  explode,
  isAmong,
} from 'xod-func-tools';

import * as settings from './settings';
import rejectWithCode, * as ERROR_CODES from '../shared/errorCodes';
import {
  DEFAULT_WORKSPACE_PATH,
  WORKSPACE_FILENAME,
  PATH_TO_DEFAULT_WORKSPACE,
  LIBS_FOLDERNAME,
  DEFAULT_PROJECT_NAME,
} from './constants';
import { errorToPlainObject } from './utils';
import * as EVENTS from '../shared/events';


// =============================================================================
//
// IPC & Event publications
//
// =============================================================================
export const WorkspaceEvents = new EventEmitter();
const emitSelectProject = R.curry(
  (send, projectMeta) => WorkspaceEvents.emit(EVENTS.SELECT_PROJECT, { send, projectMeta })
);

// pub through rendererWindow.WebContents.send(...)
// :: (a -> ()) -> Error -> Promise.Rejected Error
const handleError = R.curry((send, err) => {
  send(EVENTS.WORKSPACE_ERROR, errorToPlainObject(err));
  return Promise.reject(err);
});
// :: (String -> a -> ()) -> Path -> Boolean -> ()
const requestCreateWorkspace = R.curry(
  (send, workspacePath, force = false) => send(
    EVENTS.REQUEST_CREATE_WORKSPACE,
    {
      path: workspacePath,
      force,
    }
  )
);
// :: (String -> a -> ()) -> ProjectMeta[] -> ()
const requestSelectProject = R.curry(
  (send, projectMetas) => send(EVENTS.REQUEST_SELECT_PROJECT, projectMetas)
);
// :: (String -> a -> ()) -> Project -> ()
const requestShowProject = R.curry(
  (send, project) => send(EVENTS.REQUEST_SHOW_PROJECT, project)
);
// :: (String -> a -> ()) -> ()
const notifySaveProjectComplete = send => () => send(EVENTS.SAVE_PROJECT, true);

// :: (String -> a -> ()) -> Path -> Path -> Promise Path Error
export const updateWorkspace = R.curry(
  (send, oldPath, newPath) => {
    if (oldPath !== newPath) {
      send(EVENTS.UPDATE_WORKSPACE, newPath);
    }
    return Promise.resolve(newPath);
  }
);

// =============================================================================
//
// Utils
//
// =============================================================================

// :: ProjectMeta -> Path
const getProjectMetaPath = R.prop('path');
// :: ProjectMeta -> String
const getProjectMetaName = R.prop('name');
// :: ProjectMeta[] -> ProjectMeta
const filterDefaultProject = R.filter(
  R.compose(
    R.equals(DEFAULT_PROJECT_NAME),
    getProjectMetaName
  )
);

/**
 * Checks that workspacePath is a string and not empty and resolves path
 * (including resolving of homedir character).
 * In case that the application settings doesn't contain any workspace path
 * it could return NULL. So this function will return Promise.Rejected Error.
 * @param {*} workspacePath
 * @returns {Promise<Path,Error>} Resolved path or error with code INVALID_WORKSPACE_PATH.
 */
// :: Path -> Promise Path Error
export const resolveWorkspacePath = workspacePath => Promise.resolve(workspacePath)
  .then(R.unless(
    R.allPass([R.is(String), notEmpty]),
    () => rejectWithCode(ERROR_CODES.INVALID_WORKSPACE_PATH, new Error())
  ))
  .then(resolvePath);

// :: Path -> Path
const resolveStdLibPath = workspacePath => path.resolve(
  workspacePath, LIBS_FOLDERNAME
);
// :: Path -> Path
const resolveDefaultProjectPath = workspacePath => path.resolve(
  workspacePath, DEFAULT_PROJECT_NAME
);

// :: () -> Path
const getStdLibPath = () => path.resolve(PATH_TO_DEFAULT_WORKSPACE, LIBS_FOLDERNAME);
// :: () -> Path
const getDefaultProjectPath = () => path.resolve(PATH_TO_DEFAULT_WORKSPACE, DEFAULT_PROJECT_NAME);

// :: String -> ProjectMeta[] -> ProjectMeta
const findProjectMetaByName = R.curry(
  (nameToFind, projectMetas) => R.find(
    R.pathEq(['meta', 'name'], nameToFind),
    projectMetas
  )
);

// :: (Error -> a) -> Error -> Promise a Error
const catchInvalidWorkspace = R.curry(
  (catchFn, err) => R.ifElse(
    R.compose(
      isAmong([
        ERROR_CODES.INVALID_WORKSPACE_PATH,
        ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY,
        ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY,
      ]),
      R.prop('errorCode')
    ),
    catchFn,
    () => Promise.reject(err)
  )(err)
);

// :: String -> Project
const createEmptyProject = projectName => R.compose(
    XP.assocPatch('@/main', XP.createPatch()), // TODO: Get rid of "@" after fix xod-project/setPatchPath
    XP.setProjectName(projectName),
    XP.createProject
  )();

// =============================================================================
//
// Impure functions
//
// =============================================================================

// :: Path -> Project -> Promise Project Error
export const saveProject = R.curry(
  (workspacePath, project) => Promise.resolve(project)
    .then(arrangeByFiles)
    .then(save(workspacePath))
    .then(R.always(project))
    .catch(rejectWithCode(ERROR_CODES.CANT_SAVE_PROJECT))
);

// :: Path -> String -> String
const createAndSaveNewProject = R.curry(
  (workspacePath, projectName) => R.pipeP(
    () => Promise.resolve(createEmptyProject(projectName)),
    explode,
    saveProject,
    R.always(projectName)
  )().catch(rejectWithCode(ERROR_CODES.CANT_CREATE_NEW_PROJECT))
);

// :: () -> Promise Path Error
export const loadWorkspacePath = R.compose(
  workspacePath => Promise.resolve(workspacePath),
  settings.getWorkspacePath,
  settings.load
);

// :: Path -> Promise Path Error
export const saveWorkspacePath = workspacePath => R.compose(
    R.always(Promise.resolve(workspacePath)),
    settings.save,
    settings.setWorkspacePath(workspacePath),
    settings.load
  )();

// :: Path -> Promise Path Error
const doesWorkspaceDirExist = R.ifElse(
  doesDirectoryExist,
  Promise.resolve.bind(Promise),
  () => rejectWithCode(ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY, new Error())
);

// :: Path -> Boolean
const isWorkspaceDirEmptyOrNotExist = R.tryCatch(
  R.compose(
    R.isEmpty,
    fs.readdirSync
  ),
  R.T
);

// :: Path -> Boolean
const doesWorkspaceFileExist = R.compose(
  doesFileExist,
  workspacePath => path.resolve(workspacePath, WORKSPACE_FILENAME)
);

// :: Path -> Boolean
const doesWorkspaceHaveStdLib = R.compose(
  doesDirectoryExist,
  resolveStdLibPath
);

// :: Path -> Promise Path Error
export const isWorkspaceValid = R.cond([
  [
    R.both(doesWorkspaceFileExist, doesWorkspaceHaveStdLib),
    Promise.resolve.bind(Promise),
  ],
  [
    isWorkspaceDirEmptyOrNotExist,
    () => rejectWithCode(ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY, new Error()),
  ],
  [
    R.T,
    () => rejectWithCode(ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY, new Error()),
  ],
]);

// :: Path -> Promise Path Error
export const validateWorkspace = R.pipeP(
  resolveWorkspacePath,
  doesWorkspaceDirExist,
  isWorkspaceValid
);

// :: Path -> Promise Path Error
export const spawnWorkspaceFile = workspacePath => Promise.resolve(workspacePath)
  .then(p => path.resolve(p, WORKSPACE_FILENAME))
  .then(p => writeFile(p, ''))
  .then(R.always(workspacePath))
  .catch(rejectWithCode(ERROR_CODES.CANT_CREATE_WORKSPACE_FILE));

// :: Path -> Promise Path Error
export const spawnStdLib = workspacePath => Promise.resolve(workspacePath)
  .then(resolveStdLibPath)
  .then(copy(getStdLibPath()))
  .then(R.always(workspacePath))
  .catch(rejectWithCode(ERROR_CODES.CANT_COPY_STDLIB));

// :: Path -> Promise Path Error
export const spawnDefaultProject = workspacePath => Promise.resolve(workspacePath)
  .then(resolveDefaultProjectPath)
  .then(copy(getDefaultProjectPath()))
  .then(R.always(workspacePath))
  .catch(rejectWithCode(ERROR_CODES.CANT_COPY_DEFAULT_PROJECT));

// :: Path -> Promise ProjectMeta[] Error
export const enumerateProjects = workspacePath => getLocalProjects(workspacePath)
  .catch(rejectWithCode(ERROR_CODES.CANT_ENUMERATE_PROJECTS));

// :: Path -> Promise Path Error
const ensurePath = workspacePath => resolveWorkspacePath(workspacePath)
  .catch(() => resolvePath(DEFAULT_WORKSPACE_PATH));

// :: Path -> Promise Path Error
const spawnWorkspace = workspacePath => spawnWorkspaceFile(workspacePath).then(spawnStdLib);

// :: (String -> a -> ()) ->Path -> Promise ProjectMeta[] Error
const spawnAndLoadDefaultProject = (send, workspacePath) => spawnDefaultProject(workspacePath)
  .then(enumerateProjects)
  .then(filterDefaultProject)
  .then(R.tap(R.compose(
    emitSelectProject(send),
    R.head
  )));

// :: (String -> a -> ()) -> Path -> Promise ProjectMeta[] Error
export const loadProjectsOrSpawnDefault = R.curry(
  (send, workspacePath) => R.pipeP(
    enumerateProjects,
    R.ifElse(
      R.isEmpty,
      () => spawnAndLoadDefaultProject(send, workspacePath),
      R.tap(requestSelectProject(send))
    )
  )(workspacePath)
);

// =============================================================================
//
// Handlers
//
// =============================================================================

// :: (String -> a -> ()) -> (() -> Promise Path Error) -> Project -> Promise Project Error
export const onSaveProject = R.curry(
  (send, pathGetter, project) => R.pipeP(
    pathGetter,
    saveProject(R.__, project),
    R.tap(notifySaveProjectComplete(send))
  )().catch(handleError(send))
);

// :: (String -> a -> ()) -> (() -> Promise Path Error) -> Promise ProjectMeta[] Error
export const onOpenProject = R.curry(
  (send, pathGetter) => R.pipeP(
    pathGetter,
    loadProjectsOrSpawnDefault(send)
  )()
  .catch(handleError(send))
);

// :: (String -> a -> ()) -> (() -> Path) -> Path -> Promise Project Error
export const onSelectProject = R.curry(
  (send, pathGetter, projectMeta) => pathGetter()
    .then(workspacePath => loadProjectWithLibs(getProjectMetaPath(projectMeta), workspacePath))
    .then(({ project, libs }) => pack(project, libs))
    .then(requestShowProject(send))
    .catch(rejectWithCode(ERROR_CODES.CANT_OPEN_SELECTED_PROJECT))
    .catch(handleError(send))
);

// :: (String -> a -> ()) -> (() -> Promise Path Error) ->
//    -> (Path -> Promise Path Error) -> Promise ProjectMeta[] Error
export const onIDELaunch = R.curry(
  (send, pathGetter, pathSaver) => R.pipeP(
    pathGetter,
    oldPath => R.pipeP(
      ensurePath,
      pathSaver,
      validateWorkspace,
      updateWorkspace(send, oldPath)
    )(oldPath),
    loadProjectsOrSpawnDefault(send)
  )()
    .catch(catchInvalidWorkspace((err) => {
      const force = (err.errorCode === ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY);
      pathGetter().then(newPath => requestCreateWorkspace(send, newPath, force));
    }))
    .catch(handleError(send))
);

// :: (String -> a -> ()) -> (Path -> Promise Path Error) -> Path -> Promise ProjectMeta[] Error
export const onCreateWorkspace = R.curry(
  (send, pathSaver, workspacePath) => R.pipeP(
    spawnWorkspace,
    pathSaver,
    updateWorkspace(send, ''),
    loadProjectsOrSpawnDefault(send)
  )(workspacePath).catch(handleError(send))
);

// :: (String -> a -> ()) -> (Path -> Promise Path Error) -> Path -> Promise ProjectMeta[] Error
export const onSwitchWorkspace = R.curry(
  (send, pathSaver, workspacePath) => validateWorkspace(workspacePath)
    .then(pathSaver)
    .then(updateWorkspace(send, ''))
    .then(loadProjectsOrSpawnDefault(send))
    .catch(catchInvalidWorkspace((err) => {
      const force = (err.errorCode === ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY);
      requestCreateWorkspace(send, workspacePath, force);
    }))
    .catch(handleError(send))
);

// :: (String -> a -> ()) -> Path -> String -> ProjectMeta
// With side-effect: emitSelectProject
export const onCreateProject = R.curry(
  (send, pathGetter, projectName) => R.pipeP(
    createAndSaveNewProject,
    pathGetter,
    enumerateProjects,
    findProjectMetaByName(projectName),
    R.tap(emitSelectProject(send))
  )(pathGetter, projectName)
  .catch(handleError(send))
);

// =============================================================================
//
// IPC & Events subscriptions
//
// =============================================================================

// :: ipcEvent -> (String -> Any -> ())
const ipcSender = event => (eventName, arg) => event.sender.send(eventName, arg);

// This event is subscribed by subscribeRemoteAction function
export const subscribeToSaveProject = R.curry(
  (event, project) => onSaveProject(ipcSender(event), loadWorkspacePath, project)
);

// onSelectProject
export const subscribeToSelectProjectEvent = () => WorkspaceEvents.on(
  EVENTS.SELECT_PROJECT,
  ({ send, projectMeta }) => onSelectProject(send, loadWorkspacePath, projectMeta)
);

// Pass through IPC event into EventEmitter
export const subscribeToSelectProject = ipcMain => ipcMain.on(
  EVENTS.SELECT_PROJECT,
  (event, projectMeta) => emitSelectProject(ipcSender(event), projectMeta)
);

// onOpenProject
export const subscribeToOpenProject = ipcMain => ipcMain.on(
  EVENTS.OPEN_PROJECT,
  event => onOpenProject(ipcSender(event), loadWorkspacePath)
);

// onCreateProject
export const subscribeToCreateProject = ipcMain => ipcMain.on(
  EVENTS.CREATE_PROJECT,
  (event, projectName) => onCreateProject(ipcSender(event), loadWorkspacePath, projectName)
);

// onCreateWorkspace
export const subscribeToCreateWorkspace = ipcMain => ipcMain.on(
  EVENTS.CREATE_WORKSPACE,
  (event, workspacePath) => onCreateWorkspace(ipcSender(event), saveWorkspacePath, workspacePath)
);

// onSwitchWorkspace
export const subscribeToSwitchWorkspace = ipcMain => ipcMain.on(
  EVENTS.SWITCH_WORKSPACE,
  (event, workspacePath) => onSwitchWorkspace(ipcSender(event), saveWorkspacePath, workspacePath)
);

// =============================================================================
//
// Handy functions to call from main process
//
// =============================================================================

// :: ipcMain -> ipcMain
export const subscribeToWorkspaceEvents = R.tap(R.compose(
  R.ap([
    subscribeToSelectProject,
    subscribeToSelectProjectEvent,
    subscribeToOpenProject,
    subscribeToCreateProject,
    subscribeToCreateWorkspace,
    subscribeToSwitchWorkspace,
  ]),
  R.of
));

// :: (String -> a -> ()) -> Promise ProjectMeta[] Error
export const prepareWorkspaceOnLaunch = send => onIDELaunch(
  send, loadWorkspacePath, saveWorkspacePath
);
