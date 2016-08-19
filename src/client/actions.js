import * as ActionType from './actionTypes';
import * as STATUS from './constants/statuses';
import Selectors from './selectors';
import { uploadToEspruino } from 'xod/utils/espruino';

const getTimestamp = () => new Date().getTime();

export const addError = (error) => ({
  type: ActionType.ERROR_ADD,
  payload: error,
  meta: {
    timestamp: getTimestamp(),
    status: STATUS.STARTED,
  },
});

export const deleteError = (id) => ({
  type: ActionType.ERROR_DELETE,
  payload: {
    id,
  },
  meta: {
    timestamp: getTimestamp(),
    status: STATUS.DELETED,
  },
});

export const moveNode = (id, position) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.moveNode(projectState, id, position);

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const dragNode = (id, position) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.dragNode(projectState, id, position);

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const addNode = (typeId, position, patchId) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.addNode(projectState, typeId, position, patchId);

  dispatch({
    type: ActionType.NODE_ADD,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const deleteNode = (id) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.deleteNode(projectState, id);

  if (preparedData.payload.nodeType.error) {
    dispatch(addError({ message: preparedData.payload.nodeType.error }));
    return;
  }

  dispatch({
    type: ActionType.NODE_DELETE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const addLink = (pin1, pin2) => (dispatch, getState) => {
  const preparedData = Selectors.Prepare.addLink(getState(), pin1, pin2);

  dispatch({
    type: ActionType.LINK_ADD,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const deleteLink = (id) => ({
  type: ActionType.LINK_DELETE,
  payload: {
    id,
  },
});

export const updateMeta = (data) => ({
  type: ActionType.META_UPDATE,
  payload: data,
});

export const updateNodeProperty = (nodeId, propKey, propValue) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.updateNodeProperty(
    projectState,
    nodeId,
    propKey,
    propValue
  );

  dispatch({
    type: ActionType.NODE_UPDATE_PROPERTY,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const loadProjectFromJSON = (json) => ({
  type: ActionType.PROJECT_LOAD_DATA,
  payload: json,
});

export const upload = () => (dispatch, getState) => {
  const project = Selectors.Project.getProjectPojo(getState());
  const processes = Selectors.Processes.getProccesses(getState());
  const newId = Selectors.Processes.getNewId(processes);

  dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.STARTED },
  });

  const progress = (message, percentage) => dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.PROGRESSED },
    payload: {
      id: newId,
      message,
      percentage,
    },
  });

  const succeed = () => dispatch({
    type: ActionType.UPLOAD,
    payload: {
      id: newId,
    },
    meta: { status: STATUS.SUCCEEDED },
  });

  const fail = (err) => dispatch({
    type: ActionType.UPLOAD,
    meta: { status: STATUS.FAILED },
    payload: {
      id: newId,
      message: err.message,
    },
  });

  uploadToEspruino(project, progress)
    .then(succeed)
    .catch(err => {
      if (err.constructor !== Error) {
        throw err;
      }

      fail(err);
    });
};

export const deleteProcess = (id, type) => ({
  type,
  payload: {
    id,
  },
  meta: {
    status: STATUS.DELETED,
  },
});

export const undoPatch = (id) => ({
  type: ActionType.getPatchUndoType(id),
  payload: {},
});

export const redoPatch = (id) => ({
  type: ActionType.getPatchRedoType(id),
  payload: {},
});

export const clearHistoryPatch = (id) => ({
  type: ActionType.getPatchClearHistoryType(id),
  payload: {},
});

export const addPatch = (name, folderId) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.addPatch(projectState, name, folderId);

  dispatch({
    type: ActionType.PATCH_ADD,
    payload: preparedData,
  });
};

export const renamePatch = (id, name) => ({
  type: ActionType.PATCH_RENAME,
  payload: {
    name,
  },
  meta: {
    patchId: id,
  },
});

export const deletePatch = (id) => ({
  type: ActionType.PATCH_DELETE,
  payload: {
    id,
  },
});

export const movePatch = (changes) => ({
  type: ActionType.PATCH_MOVE,
  payload: {
    id: changes.id,
    folderId: changes.folderId,
  },
  meta: {
    patchId: changes.id,
  },
});

export const addFolder = (name, parentId) => (dispatch, getState) => {
  const projectState = Selectors.Project.getProject(getState());
  const preparedData = Selectors.Prepare.addFolder(projectState, name, parentId);
  dispatch({
    type: ActionType.FOLDER_ADD,
    payload: preparedData,
  });
};

export const renameFolder = (id, name) => ({
  type: ActionType.FOLDER_RENAME,
  payload: {
    id,
    name,
  },
});

export const deleteFolder = (id) => (dispatch, getState) => {
  const folders = Selectors.Project.getFoldersByFolderId(getState(), id);
  const patches = Selectors.Project.getPatchesByFolderId(getState(), id);

  folders.forEach(folder => dispatch(deleteFolder(folder.id)));
  patches.forEach(patch => dispatch(deletePatch(patch.id)));
  dispatch({
    type: ActionType.FOLDER_DELETE,
    payload: {
      id,
    },
  });
};

export const moveFolder = (changes) => ({
  type: ActionType.FOLDER_MOVE,
  payload: {
    id: changes.id,
    parentId: changes.parentId,
  },
});

export const closeTab = (id) => ({
  type: ActionType.TAB_CLOSE,
  payload: {
    id,
  },
});

export const sortTabs = (newOrderObject) => ({
  type: ActionType.TAB_SORT,
  payload: newOrderObject,
});
