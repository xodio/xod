import * as ActionType from './actionTypes';
import * as PrepareTo from './actionPreparations';
import * as Selectors from './selectors';
import { addError } from 'xod-client/messages/actions';
import { PROPERTY_ERRORS, NODETYPE_ERRORS } from 'xod-client/messages/constants';

export const moveNode = (id, position) => (dispatch, getState) => {
  const projectState = Selectors.getProject(getState());
  const preparedData = PrepareTo.moveNode(projectState, id, position);

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const dragNode = (id, position) => (dispatch, getState) => {
  const projectState = Selectors.getProject(getState());
  const preparedData = PrepareTo.dragNode(projectState, id, position);

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const addNode = (typeId, position, patchId) => (dispatch, getState) => {
  const projectState = Selectors.getProject(getState());
  const preparedData = PrepareTo.addNode(projectState, typeId, position, patchId);

  dispatch({
    type: ActionType.NODE_ADD,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const deleteNode = (id) => (dispatch, getState) => {
  const projectState = Selectors.getProject(getState());
  const preparedData = PrepareTo.deleteNode(projectState, id);

  if (preparedData.payload.nodeType.error) {
    dispatch(addError({
      message: NODETYPE_ERRORS[preparedData.payload.nodeType.error],
    }));
    return;
  }

  dispatch({
    type: ActionType.NODE_DELETE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const addLink = (pin1, pin2) => (dispatch, getState) => {
  const preparedData = PrepareTo.addLink(getState(), pin1, pin2);

  if (preparedData.error) {
    dispatch(addError({
      message: PROPERTY_ERRORS[preparedData.error],
    }));
    return;
  }

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

export const updateNodeProperty =
  (nodeId, propKind, propKey, propValue) => (dispatch, getState) => {
    const projectState = Selectors.getProject(getState());
    const preparedData = PrepareTo.updateNodeProperty(
      projectState,
      nodeId,
      propKind,
      propKey,
      propValue
    );

    dispatch({
      type: ActionType.NODE_UPDATE_PROPERTY,
      payload: preparedData.payload,
      meta: preparedData.meta,
    });
  };

export const changePinMode = (nodeId, pinKey, injected) => (dispatch, getState) => {
  const projectState = Selectors.getProject(getState());
  const preparedData = PrepareTo.changePinMode(
    projectState,
    nodeId,
    pinKey,
    injected
  );

  if (preparedData.error) {
    dispatch(addError({
      message: PROPERTY_ERRORS[preparedData.error],
    }));
    return;
  }

  dispatch({
    type: ActionType.NODE_CHANGE_PIN_MODE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const loadProjectFromJSON = (json) => ({
  type: ActionType.PROJECT_LOAD_DATA,
  payload: json,
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
  const projectState = Selectors.getProject(getState());
  const preparedData = PrepareTo.addPatch(projectState, name, folderId);

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

export const renameProject = (name) => ({
  type: ActionType.PROJECT_RENAME,
  payload: name,
});

export const addFolder = (name, parentId) => (dispatch, getState) => {
  const projectState = Selectors.getProject(getState());
  const preparedData = PrepareTo.addFolder(projectState, name, parentId);
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
  const folders = Selectors.getFoldersByFolderId(getState(), id);
  const patches = Selectors.getPatchesByFolderId(getState(), id);

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
