import R from 'ramda';
import P from 'path';
import FS from 'fs';
import EventEmitter from 'events';

import XP from 'xod-project';
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

import rejectWithCode, * as ERROR_CODES from './errorCodes';
import * as settings from './settings';
import {
  DEFAULT_WORKSPACE_PATH,
  WORKSPACE_FILENAME,
  PATH_TO_DEFAULT_WORKSPACE,
  LIBS_FOLDERNAME,
  DEFAULT_PROJECT_NAME,
  EVENT_REQUEST_SELECT_PROJECT,
  EVENT_OPEN_PROJECT,
  EVENT_CREATE_PROJECT,
  EVENT_REQUEST_OPEN_PROJECT,
  EVENT_REQUEST_CREATE_WORKSPACE,
  EVENT_SWITCH_WORKSPACE,
  EVENT_WORKSPACE_ERROR,
  EVENT_CREATE_WORKSPACE,
} from './constants';

// =============================================================================
//
// IPC & Event publications
//
// =============================================================================
const WorkspaceEvents = new EventEmitter();
const emitSelectProject = data => WorkspaceEvents.emit(EVENT_OPEN_PROJECT, data);

// pub through rendererWindow.WebContents.send(...)
// :: (a -> ()) -> Error -> Promise.Rejected Error
const handleError = R.curry((send, err) => {
  send(EVENT_WORKSPACE_ERROR, err);
  return Promise.reject(err);
});
// :: (String -> a -> ()) -> Path -> Boolean -> ()
const requestCreateWorkspace = R.curry(
  (send, path, force = false) => send(EVENT_REQUEST_CREATE_WORKSPACE, { path, force })
);
// :: (String -> a -> ()) -> ProjectMeta[] -> ()
const requestSelectProject = R.curry(
  (send, projectMetas) => send(EVENT_REQUEST_SELECT_PROJECT, projectMetas)
);
// :: (String -> a -> ()) -> Project -> ()
const requestOpenProject = R.curry(
  (send, project) => send(EVENT_REQUEST_OPEN_PROJECT, project)
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

// :: () -> Promise.Resolved Path
export const loadWorkspacePath = R.compose(
  path => Promise.resolve(path),
  settings.getWorkspacePath,
  settings.load
);

// :: Path -> Promise.Resolved Path
export const saveWorkspacePath = path => R.compose(
    R.always(Promise.resolve(path)),
    settings.save,
    settings.setWorkspacePath(path),
    settings.load
  )();


// :: () -> Promise.Resolved String
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

// :: Path -> Promise Path Error
export const isWorkspaceValid = path => Promise.all([
  isWorkspaceFileExists(path),
  isWorkspaceDirEmpty(path),
])
  .then(R.any(R.equals(true)))
  .then((isValid) => {
    if (isValid) return path;
    return rejectWithCode(ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY, new Error());
  });

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

// :: Path -> Promise ProjectMeta[] Error
const spawnAndLoadDefaultProject = (send, path) => spawnDefaultProject(path)
  .then(enumerateProjects)
  .then(filterDefaultProject)
  .then(R.tap(R.compose(
    emitSelectProject,
    R.head
  )));

// :: Path -> Promise ProjectMeta[] Error
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

// :: (String -> a -> ()) -> (() -> Promise Path Error) -> Promise ProjectMeta[] Error
export const onOpenProject = R.curry(
  (send, workspaceGetter) => R.pipeP(
    workspaceGetter,
    loadProjectsOrSpawnDefault(send)
  )()
  .catch(handleError(send))
);

// :: Path -> ProjectMeta -> Promise Project Error
export const onSelectProject = R.curry(
  (send, workspacePath, projectMeta) => Promise.resolve(projectMeta)
    .then(getProjectMetaPath)
    .then(path => loadProjectWithLibs(path, workspacePath))
    .then(({ project, libs }) => pack(project, libs))
    // TODO: Get rid of next then, when we'll get rid of V1
    .then((v1) => {
      const convertedProject = XP.toV2(v1);
      return (convertedProject.isLeft) ?
        Promise.reject(convertedProject.value) :
        convertedProject;
    })
    .then(requestOpenProject(send))
    .catch(rejectWithCode(ERROR_CODES.CANT_OPEN_SELECTED_PROJECT))
);

// :: (String -> a -> ()) -> (() -> Promise Path Error) ->
//    -> (Path -> Promise Path Error) -> Promise ProjectMeta[] Error
export const onIDELaunch = R.curry(
  (send, workspaceGetter, pathSaver) => R.pipeP(
    workspaceGetter,
    ensurePath,
    ensureWorkspace,
    pathSaver,
    loadProjectsOrSpawnDefault(send)
  )().catch(handleError(send))
);

// :: (String -> a -> ()) -> (Path -> Promise Path Error) -> Path -> Promise ProjectMeta[] Error
export const onWorkspaceCreate = R.curry(
  (send, pathSaver, path) => R.pipeP(
    spawnWorkspace,
    pathSaver,
    loadProjectsOrSpawnDefault(send)
  )(path).catch(handleError(send))
);

// :: (String -> a -> ()) -> (Path -> Promise Path Error) -> Path -> Promise ProjectMeta[] Error
export const onSwitchWorkspace = R.curry(
  (send, pathSaver, path) => validateWorkspace(path)
    .then(pathSaver)
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
  (send, workspacePath, projectName) => R.pipeP(
    createAndSaveNewProject,
    () => enumerateProjects(workspacePath),
    findProjectMetaByName(projectName),
    R.tap(emitSelectProject)
  )(workspacePath, projectName)
    .catch(handleError(send))
);

// =============================================================================
//
// IPC & Events subscriptions
//
// =============================================================================

// Pass through IPC event into EventEmitter
export const subscribeSelectProject = ipcMain => ipcMain.on(
  EVENT_OPEN_PROJECT,
  (event, projectMeta) => emitSelectProject({ send: event.sender.send, projectMeta })
);

// onSelectProject
export const subscribeSelectProjectEvent = () => WorkspaceEvents.on(
  EVENT_OPEN_PROJECT,
  ({ send, projectMeta }) => onSelectProject(loadWorkspacePath(), projectMeta)
    .catch(handleError(send))
);

// onOpenProject
export const subscribeOpenProject = ipcMain => ipcMain.on(
  EVENT_CREATE_PROJECT,
  event => onOpenProject(event.sender.send, loadWorkspacePath)
);

// onCreateProject
export const subscribeCreateProject = ipcMain => ipcMain.on(
  EVENT_CREATE_PROJECT,
  (event, projectName) => onCreateProject(event.sender.send, loadWorkspacePath(), projectName)
);

// onCreateWorkspace
export const subscribeCreateWorkspace = ipcMain => ipcMain.on(
  EVENT_CREATE_WORKSPACE,
  (event, path) => onWorkspaceCreate(event.sender.send, saveWorkspacePath, path)
);

// onSwitchWorkspace
export const subscrubeSwitchWorkspace = ipcMain => ipcMain.on(
  EVENT_SWITCH_WORKSPACE,
  (event, path) => onSwitchWorkspace(event.sender.send, saveWorkspacePath, path)
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
    subscrubeSwitchWorkspace,
  ]),
  R.of
));

// :: (String -> a -> ()) -> Promise ProjectMeta[] Error
export const prepareWorkspaceOnLaunch = send => onIDELaunch(
  send, loadWorkspacePath, saveWorkspacePath
);
