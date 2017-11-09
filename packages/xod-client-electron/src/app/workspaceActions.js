import R from 'ramda';
import EventEmitter from 'events';
import path from 'path';

import * as XP from 'xod-project';
import {
  resolveLibPath,
  spawnWorkspaceFile,
  spawnDefaultProject,
  saveProject,
  getLocalProjects,
  validateWorkspace,
  loadProject,
  getFilePath,
  filterDefaultProject,
  findProjectMetaByName,
  resolveDefaultProjectPath,
  ensureWorkspacePath,
  saveProjectAsLibrary,
  ERROR_CODES as FS_ERROR_CODES,
} from 'xod-fs';
import {
  explode,
  isAmong,
  rejectWithCode,
} from 'xod-func-tools';

import * as settings from './settings';
import * as ERROR_CODES from '../shared/errorCodes';
import { errorToPlainObject } from './utils';
import * as EVENTS from '../shared/events';


export const getPathToBundledWorkspace = () => path.resolve(__dirname, '../workspace');
export const getPathToBundledLibs = () => resolveLibPath(getPathToBundledWorkspace());

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

// :: () -> Path
export const getDefaultProjectPath = () => resolveDefaultProjectPath(getPathToBundledWorkspace());

// :: (Error -> a) -> Error -> Promise a Error
const catchInvalidWorkspace = R.curry(
  (catchFn, err) => R.ifElse(
    R.compose(
      isAmong([
        FS_ERROR_CODES.INVALID_WORKSPACE_PATH,
        FS_ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY,
        FS_ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY,
      ]),
      R.prop('errorCode')
    ),
    catchFn,
    () => Promise.reject(err)
  )(err)
);

// :: String -> Project
const createEmptyProject = projectName => R.compose(
    XP.assocPatch(XP.getLocalPath('main'), XP.createPatch()),
    XP.setProjectName(projectName),
    XP.createProject
  )();

// =============================================================================
//
// Impure functions
//
// =============================================================================

// :: Path -> String -> String
const createAndSaveNewProject = R.curry(
  (pathGetter, projectName) => R.pipeP(
    Promise.resolve.bind(Promise),
    createEmptyProject,
    explode,
    project => R.pipeP(
      pathGetter,
      saveProject(R.__, project)
    )(),
    R.always(projectName)
  )(projectName)
    .catch(rejectWithCode(ERROR_CODES.CANT_CREATE_NEW_PROJECT))
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

// :: (String -> a -> ()) ->Path -> Promise ProjectMeta[] Error
const spawnAndLoadDefaultProject = (send, workspacePath) =>
  spawnDefaultProject(getDefaultProjectPath(), workspacePath)
    .catch(rejectWithCode(ERROR_CODES.CANT_COPY_DEFAULT_PROJECT))
    .then(getLocalProjects)
    .then(filterDefaultProject)
    .then(R.tap(R.compose(
      emitSelectProject(send),
      R.head
    )));

// :: (String -> a -> ()) -> Path -> Promise ProjectMeta[] Error
export const loadProjectsOrSpawnDefault = R.curry(
  (send, workspacePath) => R.pipeP(
    getLocalProjects,
    R.ifElse(
      R.isEmpty,
      () => spawnAndLoadDefaultProject(send, workspacePath),
      R.tap(requestSelectProject(send))
    )
  )(workspacePath)
);

// :: SaveLibPayload :: { request: LibParams, xodball: Xodball }
// :: IpcEvent -> SaveLibPayload -> Promise SaveLibPayload Error
export const saveLibrary = R.curry(
  (event, payload) => R.composeP(
    () => {
      event.sender.send(
        EVENTS.INSTALL_LIBRARY_COMPLETE,
        payload.request
      );
      return payload;
    },
    saveProjectAsLibrary(payload.request.owner, payload.xodball),
    loadWorkspacePath
  )()
    .catch((err) => {
      event.sender.send(
        EVENTS.INSTALL_LIBRARY_FAILED,
        errorToPlainObject(err)
      );
    })
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
    .then(() => loadProject(getFilePath(projectMeta), [getPathToBundledLibs()]))
    .then(requestShowProject(send))
    .catch(R.ifElse(
      R.prop('errorCode'),
      Promise.reject.bind(Promise),
      rejectWithCode(ERROR_CODES.CANT_OPEN_SELECTED_PROJECT)
    ))
    .catch(handleError(send))
);

// :: (String -> a -> ()) -> (Path -> Promise Path Error) -> Path -> Promise ProjectMeta[] Error
export const onCreateWorkspace = R.curry(
  (send, pathSaver, workspacePath) => R.pipeP(
    spawnWorkspaceFile,
    pathSaver,
    updateWorkspace(send, ''),
    loadProjectsOrSpawnDefault(send)
  )(workspacePath).catch(handleError(send))
);

// :: (String -> a -> ()) -> (() -> Promise Path Error) ->
//    -> (Path -> Promise Path Error) -> Promise ProjectMeta[] Error
export const onIDELaunch = R.curry(
  (send, pathGetter, pathSaver) => {
    let oldPath = null;
    let newPath = null;

    return R.pipeP(
      pathGetter,
      R.tap((p) => { oldPath = p; }),
      ensureWorkspacePath,
      R.tap((p) => { newPath = p; }),
      pathSaver,
      validateWorkspace,
      updateWorkspace(send, oldPath),
      loadProjectsOrSpawnDefault(send)
    )()
      .catch(catchInvalidWorkspace(
        (err) => {
          const isHomeDir = (oldPath !== newPath);
          const forceCreate = (err.errorCode === FS_ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY);
          if (isHomeDir && !forceCreate) { return onCreateWorkspace(send, pathSaver, newPath); }
          requestCreateWorkspace(send, newPath, forceCreate);
          return [];
        }
      ))
      .catch(handleError(send));
  }
);

// :: (String -> a -> ()) -> (Path -> Promise Path Error) -> Path -> Promise ProjectMeta[] Error
export const onSwitchWorkspace = R.curry(
  (send, pathSaver, workspacePath) => validateWorkspace(workspacePath)
    .then(pathSaver)
    .then(updateWorkspace(send, ''))
    .then(loadProjectsOrSpawnDefault(send))
    .catch(catchInvalidWorkspace((err) => {
      const force = (err.errorCode === FS_ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY);
      requestCreateWorkspace(send, workspacePath, force);
    }))
    .catch(handleError(send))
);

// :: (String -> a -> ()) -> Path -> String -> ProjectMeta
// With side-effect: emitSelectProject
export const onCreateProject = R.curry(
  (send, pathGetter, projectName) => R.pipeP(
    createAndSaveNewProject,
    R.tap(notifySaveProjectComplete(send)),
    pathGetter,
    getLocalProjects,
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
