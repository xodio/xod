import R from 'ramda';
import P from 'path';
import FS from 'fs';
import EventEmitter from 'events';

import * as XP from 'xod-project';
import {
  resolvePath,
  writeFile,
  copy,
  save,
  getProjects,
  isDirectoryExists,
  isFileExists,
  loadProjectWithLibs,
  pack,
  arrangeByFilesV2,
} from 'xod-fs';
import {
  notEmpty,
  explode,
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
  (send, path, force = false) => send(EVENTS.REQUEST_CREATE_WORKSPACE, { path, force })
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

// :: ProjectMeta -> String
const getProjectMetaName = R.path(['meta', 'name']);
// :: ProjectMeta -> Path
const getProjectMetaPath = R.prop('path');
// :: ProjectMeta[] -> ProjectMeta
const filterDefaultProject = R.filter(
  R.compose(
    R.equals(DEFAULT_PROJECT_NAME),
    getProjectMetaName
  )
);

// :: Path -> Promise Path Error
export const validatePath = path => Promise.resolve(path)
  .then(R.unless(
    R.allPass([
      R.is(String),
      notEmpty,
    ]),
    () => Promise.reject(new Error())
  ))
  .then(resolvePath)
  .catch(rejectWithCode(ERROR_CODES.INVALID_WORKSPACE_PATH));

const createWorkspaceFile = () => '';

// :: Path -> Path
const resolveStdLibDestination = path => P.resolve(path, LIBS_FOLDERNAME);
// :: Path -> Path
const resolveDefaultProjectDestination = path => P.resolve(path, DEFAULT_PROJECT_NAME);

// :: () -> Path
const getStdLibPath = () => P.resolve(
  __dirname, PATH_TO_DEFAULT_WORKSPACE, LIBS_FOLDERNAME
);
// :: () -> Path
const getDefaultProjectPath = () => P.resolve(
  __dirname, PATH_TO_DEFAULT_WORKSPACE, DEFAULT_PROJECT_NAME
);

// :: Path -> ProjectMeta[] -> ProjectMeta[]
export const filterLocalProjects = R.curry((workspacePath, projects) => R.reject(
R.compose(
  R.equals(LIBS_FOLDERNAME),
  R.head,
  R.split(P.sep),
  projectPath => P.relative(workspacePath, projectPath),
  getProjectMetaPath
),
projects
));

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
      R.contains(R.__, [
        ERROR_CODES.INVALID_WORKSPACE_PATH,
        ERROR_CODES.WORKSPACE_DIR_NOT_EXIST,
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
    .then(arrangeByFilesV2)
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
  path => Promise.resolve(path),
  settings.getWorkspacePath,
  settings.load
);

// :: Path -> Promise Path Error
export const saveWorkspacePath = path => R.compose(
    R.always(Promise.resolve(path)),
    settings.save,
    settings.setWorkspacePath(path),
    settings.load
  )();


// :: () -> Promise String Error
export const getHomeDir = () => Promise.resolve(DEFAULT_WORKSPACE_PATH);

// :: Path -> Promise Path Error
const isWorkspaceDirExists = path => Promise.resolve(path)
  .then(isDirectoryExists)
  .then((exist) => {
    if (exist) return path;
    return rejectWithCode(ERROR_CODES.WORKSPACE_DIR_NOT_EXIST, new Error());
  });

// :: Path -> Promise Boolean Error
const isWorkspaceDirEmpty = path => new Promise(
  (resolve, reject) => FS.readdir(path, (err, files) => {
    if (err) return reject(err);
    return resolve(!files.length);
  })
);

// :: Path -> Promise Boolean Error
const isWorkspaceFileExists = path => Promise.resolve(path)
  .then(p => P.resolve(p, WORKSPACE_FILENAME))
  .then(isFileExists);

// :: Path -> Promise Boolean Error
const isWorkspaceHasStdLib = path => Promise.resolve(path)
  .then(resolveStdLibDestination)
  .then(isDirectoryExists);

// :: Path -> Promise Path Error
export const isWorkspaceValid = path => Promise.all([
  isWorkspaceFileExists(path),
  isWorkspaceHasStdLib(path),
  isWorkspaceDirEmpty(path),
]).then(
    ([fileExist, libExist, dirEmpty]) => {
      const hasFileAndLibs = (fileExist && libExist);
      if (hasFileAndLibs) { return path; }
      if (dirEmpty) {
        return rejectWithCode(ERROR_CODES.WORKSPACE_DIR_NOT_EXIST, new Error());
      }
      return rejectWithCode(ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY, new Error());
    }
  );

// :: Path -> Promise Path Error
export const validateWorkspace = R.pipeP(
  validatePath,
  isWorkspaceDirExists,
  isWorkspaceValid
);

// :: Path -> Promise Path Error
export const spawnWorkspaceFile = path => Promise.resolve(path)
  .then(p => P.resolve(p, WORKSPACE_FILENAME))
  .then(p => writeFile(p, createWorkspaceFile()))
  .then(R.always(path))
  .catch(rejectWithCode(ERROR_CODES.CANT_CREATE_WORKSPACE_FILE));

// :: Path -> Promise Path Error
export const spawnStdLib = path => Promise.resolve(path)
  .then(resolveStdLibDestination)
  .then(copy(getStdLibPath()))
  .then(R.always(path))
  .catch(rejectWithCode(ERROR_CODES.CANT_COPY_STDLIB));

// :: Path -> Promise Path Error
export const spawnDefaultProject = path => Promise.resolve(path)
  .then(resolveDefaultProjectDestination)
  .then(copy(getDefaultProjectPath()))
  .then(R.always(path))
  .catch(rejectWithCode(ERROR_CODES.CANT_COPY_DEFAULT_PROJECT));

// :: Path -> Promise ProjectMeta[] Error
export const enumerateProjects = path => getProjects(path)
  .catch(rejectWithCode(ERROR_CODES.CANT_ENUMERATE_PROJECTS));

// =============================================================================
//
// Compositions of steps
//
// =============================================================================

// :: Path -> Promise Path Error
const ensurePath = path => validatePath(path).catch(getHomeDir);

// :: Path -> Promise Path Error
const spawnWorkspace = path => spawnWorkspaceFile(path).then(spawnStdLib);

// :: Path -> Promise Path Error
const ensureWorkspace = path => validateWorkspace(path)
  .catch(() => spawnWorkspace(path));

// :: (String -> a -> ()) ->Path -> Promise ProjectMeta[] Error
const spawnAndLoadDefaultProject = (send, path) => spawnDefaultProject(path)
  .then(enumerateProjects)
  .then(filterDefaultProject)
  .then(R.tap(R.compose(
    emitSelectProject(send),
    R.head
  )));

// :: (String -> a -> ()) -> Path -> Promise ProjectMeta[] Error
export const loadProjectsOrSpawnDefault = R.curry(
  (send, path) => R.pipeP(
    enumerateProjects,
    filterLocalProjects(path),
    R.ifElse(
      R.isEmpty,
      () => spawnAndLoadDefaultProject(send, path),
      R.tap(requestSelectProject(send))
    )
  )(path)
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
    // TODO: Get rid of next then, when we'll get rid of V1
    .then((v1) => {
      const convertedProject = XP.toV2(v1);
      return (convertedProject.isLeft) ?
        Promise.reject(convertedProject.value) :
        convertedProject;
    })
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
      ensureWorkspace,
      pathSaver,
      updateWorkspace(send, oldPath)
    )(oldPath),
    loadProjectsOrSpawnDefault(send)
  )().catch(handleError(send))
);

// :: (String -> a -> ()) -> (Path -> Promise Path Error) -> Path -> Promise ProjectMeta[] Error
export const onCreateWorkspace = R.curry(
  (send, pathSaver, path) => R.pipeP(
    spawnWorkspace,
    pathSaver,
    updateWorkspace(send, ''),
    loadProjectsOrSpawnDefault(send)
  )(path).catch(handleError(send))
);

// :: (String -> a -> ()) -> (Path -> Promise Path Error) -> Path -> Promise ProjectMeta[] Error
export const onSwitchWorkspace = R.curry(
  (send, pathSaver, path) => validateWorkspace(path)
    .then(pathSaver)
    .then(updateWorkspace(send, ''))
    .then(loadProjectsOrSpawnDefault(send))
    .catch(catchInvalidWorkspace((err) => {
      const force = (err.errorCode === ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY);
      requestCreateWorkspace(send, path, force);
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
export const subscribeSaveProject = R.curry(
  (event, project) => onSaveProject(ipcSender(event), loadWorkspacePath, project)
);

// onSelectProject
export const subscribeSelectProjectEvent = () => WorkspaceEvents.on(
  EVENTS.SELECT_PROJECT,
  ({ send, projectMeta }) => onSelectProject(send, loadWorkspacePath, projectMeta)
);

// Pass through IPC event into EventEmitter
export const subscribeSelectProject = ipcMain => ipcMain.on(
  EVENTS.SELECT_PROJECT,
  (event, projectMeta) => emitSelectProject(ipcSender(event), projectMeta)
);

// onOpenProject
export const subscribeOpenProject = ipcMain => ipcMain.on(
  EVENTS.OPEN_PROJECT,
  event => onOpenProject(ipcSender(event), loadWorkspacePath)
);

// onCreateProject
export const subscribeCreateProject = ipcMain => ipcMain.on(
  EVENTS.CREATE_PROJECT,
  (event, projectName) => onCreateProject(ipcSender(event), loadWorkspacePath, projectName)
);

// onCreateWorkspace
export const subscribeCreateWorkspace = ipcMain => ipcMain.on(
  EVENTS.CREATE_WORKSPACE,
  (event, path) => onCreateWorkspace(ipcSender(event), saveWorkspacePath, path)
);

// onSwitchWorkspace
export const subscribeSwitchWorkspace = ipcMain => ipcMain.on(
  EVENTS.SWITCH_WORKSPACE,
  (event, path) => onSwitchWorkspace(ipcSender(event), saveWorkspacePath, path)
);

// =============================================================================
//
// Handy functions to call from main process
//
// =============================================================================

// :: ipcMain -> ipcMain
export const subscribeWorkspaceEvents = R.tap(R.compose(
  R.ap([
    subscribeSelectProject,
    subscribeSelectProjectEvent,
    subscribeOpenProject,
    subscribeCreateProject,
    subscribeCreateWorkspace,
    subscribeSwitchWorkspace,
  ]),
  R.of
));

// :: (String -> a -> ()) -> Promise ProjectMeta[] Error
export const prepareWorkspaceOnLaunch = send => onIDELaunch(
  send, loadWorkspacePath, saveWorkspacePath
);
