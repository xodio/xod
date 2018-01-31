import * as R from 'ramda';
import EventEmitter from 'events';
import path from 'path';
import { Maybe } from 'ramda-fantasy';

import * as XP from 'xod-project';
import {
  spawnWorkspaceFile,
  saveAll,
  validateWorkspace,
  loadProject,
  getFilePath,
  resolveDefaultProjectPath,
  ensureWorkspacePath,
  saveLibraryEntirely,
  ERROR_CODES as FS_ERROR_CODES,
} from 'xod-fs';
import {
  isAmong,
  rejectWithCode,
  allPromises,
  notNil,
  explodeMaybe,
} from 'xod-func-tools';

import * as settings from './settings';
import * as ERROR_CODES from '../shared/errorCodes';
import { errorToPlainObject } from './utils';
import * as EVENTS from '../shared/events';


export const getPathToBundledWorkspace = () => path.resolve(__dirname, '../workspace');

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

// :: (String -> a -> ()) -> Project -> ()
const requestShowProject = R.curry(
  (send, project) => send(EVENTS.REQUEST_SHOW_PROJECT, project)
);
// :: (String -> a -> ()) -> ()
const notifySaveAllComplete = send => () => send(EVENTS.SAVE_ALL, true);

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
      R.both(
        notNil,
        isAmong([
          FS_ERROR_CODES.INVALID_WORKSPACE_PATH,
          FS_ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY,
          FS_ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY,
        ]),
      ),
      R.prop('errorCode')
    ),
    catchFn,
    () => Promise.reject(err)
  )(err)
);

// =============================================================================
//
// Impure functions
//
// =============================================================================

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

// :: SaveLibPayload :: { request: LibParams, projects: Map LibName Project }
// :: IpcEvent -> SaveLibPayload -> Promise SaveLibPayload Error
export const saveLibraries = R.curry(
  (event, payload) => R.composeP(
    () => {
      event.sender.send(
        EVENTS.INSTALL_LIBRARIES_COMPLETE,
        payload.request
      );
      return payload;
    },
    wsPath => R.compose(
      allPromises,
      R.values,
      R.mapObjIndexed((proj, libName) => {
        const owner = XP.getOwnerName(libName);
        return saveLibraryEntirely(owner, proj, wsPath);
      })
    )(payload.projects),
    loadWorkspacePath
  )()
    .catch((err) => {
      event.sender.send(
        EVENTS.INSTALL_LIBRARIES_FAILED,
        errorToPlainObject(err)
      );
    })
);

// :: (Path -> ()) -> Path -> Promise Project Error
export const loadProjectByPath = R.curry(
  (updateProjectPath, pathToOpen) => R.composeP(
    R.tap(() => updateProjectPath(pathToOpen)),
    loadProject(R.__, pathToOpen),
    R.append(getPathToBundledWorkspace()),
    loadWorkspacePath
  )()
);

// =============================================================================
//
// Handlers
//
// =============================================================================

// SaveData :: {
//   oldProject :: Project,
//   newProject :: Project,
//   projectPath :: Path,
//   updateProjectPath :: Boolean
// }
//
// :: (Path -> ()) -> (String -> a -> ()) -> (() -> Promise Path Error) -> SaveData ->
//    -> Promise Project Error
export const onSaveAll = R.curry(
  (updateProjectPath, send, pathGetter, saveData) => R.pipeP(
    pathGetter,
    saveAll(R.__, saveData.projectPath, saveData.oldProject, saveData.newProject),
    R.tap(notifySaveAllComplete(send)),
    R.tap(() => {
      if (saveData.updateProjectPath) {
        updateProjectPath(saveData.projectPath);
      }
    })
  )().catch(handleError(send))
);

// :: (Path -> ()) -> (String -> a -> ()) -> Path -> Promise Project Error
export const onLoadProject = R.curry(
  (updateProjectPath, send, pathToOpen) =>
    loadProjectByPath(updateProjectPath, pathToOpen)
      .then(project => send(EVENTS.REQUEST_SHOW_PROJECT, project))
      .catch(err => send(EVENTS.ERROR, errorToPlainObject(err)))
);

// :: (Path -> ()) -> (String -> a -> ()) -> (() -> Path) -> Path -> Promise Project Error
export const onSelectProject = R.curry(
  (updateProjectPath, send, pathGetter, projectMeta) => {
    const projectPath = getFilePath(projectMeta);

    return pathGetter()
      .then(() => loadProject([getPathToBundledWorkspace()], projectPath))
      .then(requestShowProject(send))
      .then(R.tap(() => updateProjectPath(projectPath)))
      .catch(R.ifElse(
        R.prop('errorCode'),
        Promise.reject.bind(Promise),
        rejectWithCode(ERROR_CODES.CANT_OPEN_SELECTED_PROJECT)
      ))
      .catch(handleError(send));
  }
);

export const onOpenBundledProject = (send, updateProjectPath, projectName) => {
  const pathToBundledWorkspace = getPathToBundledWorkspace();
  const projectPath = path.join(pathToBundledWorkspace, projectName);
  return onLoadProject(
    () => updateProjectPath(null),
    send,
    projectPath
  );
};

// :: (String -> a -> ()) -> (Path -> Promise Path Error) -> Path -> Promise ProjectMeta[] Error
export const onCreateWorkspace = R.curry(
  (send, pathSaver, workspacePath) => R.pipeP(
    spawnWorkspaceFile,
    pathSaver,
    updateWorkspace(send, ''),
  )(workspacePath).catch(handleError(send))
);

// :: Path -> Promise Path Error
const ensureWorkspace = workspacePath => validateWorkspace(workspacePath)
  .catch((err) => {
    if (err.errorCode === FS_ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY) {
      return spawnWorkspaceFile(workspacePath);
    }
    throw err;
  });

// :: (String -> a -> ()) -> (() -> Promise Path Error) ->
//    -> (Path -> Promise Path Error) -> Promise ProjectMeta[] Error
export const onIDELaunch = R.curry(
  (send, updateProjectPath, getFileToOpen, pathGetter, pathSaver) => {
    let oldPath = null;
    let newPath = null;

    return R.pipeP(
      pathGetter,
      R.tap((p) => { oldPath = p; }),
      ensureWorkspacePath,
      R.tap((p) => { newPath = p; }),
      pathSaver,
      ensureWorkspace,
      updateWorkspace(send, oldPath),
      () => {
        const maybePatchToOpen = getFileToOpen();

        if (Maybe.isNothing(maybePatchToOpen)) {
          const isFirstLaunch = R.isEmpty(oldPath);
          const projectName = isFirstLaunch ? 'welcome-to-xod' : 'welcome-again';

          return onOpenBundledProject(send, updateProjectPath, projectName).then(() => {
            // TODO: better pass it along the project with REQUEST_SHOW_PROJECT event
            if (!isFirstLaunch) {
              send(EVENTS.PAN_TO_CENTER);
            }
          });
        }

        const projectPath = explodeMaybe(
          'Imposible error: we just checked Maybe for being Nothing',
          maybePatchToOpen
        );
        return onLoadProject(updateProjectPath, send, projectPath);
      }
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
    .catch(catchInvalidWorkspace((err) => {
      const force = (err.errorCode === FS_ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY);
      requestCreateWorkspace(send, workspacePath, force);
    }))
    .catch(handleError(send))
);

// :: (Path -> ()) -> void
export const onCreateProject = updateProjectPath => updateProjectPath(null);

// =============================================================================
//
// IPC & Events subscriptions
//
// =============================================================================

// :: ipcEvent -> (String -> Any -> ())
const ipcSender = event => (eventName, arg) => event.sender.send(eventName, arg);

// This event is subscribed by subscribeRemoteAction function
export const subscribeToSaveAll = R.curry(
  (store, event, saveData) =>
    onSaveAll(
      store.dispatch.updateProjectPath,
      ipcSender(event),
      loadWorkspacePath,
      saveData
    )
);

// onSelectProject
export const subscribeToSelectProjectEvent = R.uncurryN(
  2,
  store => WorkspaceEvents.on(
    EVENTS.SELECT_PROJECT,
    ({ send, projectMeta }) => onSelectProject(
      store.dispatch.updateProjectPath,
      send,
      loadWorkspacePath,
      projectMeta
    )
  )
);

// Pass through IPC event into EventEmitter
export const subscribeToSelectProject = ipcMain => ipcMain.on(
  EVENTS.SELECT_PROJECT,
  (event, projectMeta) => emitSelectProject(ipcSender(event), projectMeta)
);

export const subscribeToOpenBundledProject = R.curry(
  (store, ipcMain) => ipcMain.on(
    EVENTS.OPEN_BUNDLED_PROJECT,
    (event, projectName) => onOpenBundledProject(
      ipcSender(event),
      store.dispatch.updateProjectPath,
      projectName
    )
  )
);

// onCreateProject
export const subscribeToCreateProject = R.curry(
  (store, ipcMain) => ipcMain.on(
    EVENTS.CREATE_PROJECT,
    () => onCreateProject(store.dispatch.updateProjectPath)
  )
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

// onLoadProject
export const subscribeToLoadProject = R.curry(
  (store, ipcMain) => ipcMain.on(
    EVENTS.LOAD_PROJECT,
    (event, projectPath) => onLoadProject(
      store.dispatch.updateProjectPath,
      ipcSender(event),
      projectPath
    )
  )
);

// =============================================================================
//
// Handy functions to call from main process
//
// =============================================================================

// :: ipcMain -> Store -> ipcMain
export const subscribeToWorkspaceEvents = (ipcMain, store) => R.tap(R.compose(
  R.ap([
    subscribeToSelectProject,
    subscribeToSelectProjectEvent(store),
    subscribeToOpenBundledProject(store),
    subscribeToCreateProject(store),
    subscribeToCreateWorkspace,
    subscribeToSwitchWorkspace,
    subscribeToLoadProject(store),
  ]),
  R.of
))(ipcMain);

// :: (String -> a -> ()) -> Promise ProjectMeta[] Error
export const prepareWorkspaceOnLaunch = (send, updateProjectPath, getFileToOpen) =>
  onIDELaunch(send, updateProjectPath, getFileToOpen, loadWorkspacePath, saveWorkspacePath);
