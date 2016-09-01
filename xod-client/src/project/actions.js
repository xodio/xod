import * as ActionType from './actionTypes';
import * as Selectors from './selectors';
import { addError } from 'xod-client/messages/actions';
import { NODETYPE_ERRORS } from 'xod-client/messages/constants';

export const moveNode = (id, position) => (dispatch, getState) => {
  const projectState = Selectors.getProject(getState());
  const preparedData = Selectors.prepareToMoveNode(projectState, id, position);

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const dragNode = (id, position) => (dispatch, getState) => {
  const projectState = Selectors.getProject(getState());
  const preparedData = Selectors.prepareToDragNode(projectState, id, position);

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const addNode = (typeId, position, patchId) => (dispatch, getState) => {
  const projectState = Selectors.getProject(getState());
  const preparedData = Selectors.prepareToAddNode(projectState, typeId, position, patchId);

  dispatch({
    type: ActionType.NODE_ADD,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const deleteNode = (id) => (dispatch, getState) => {
  const projectState = Selectors.getProject(getState());
  const preparedData = Selectors.prepareToDeleteNode(projectState, id);

  if (preparedData.payload.nodeType.error) {
    dispatch(addError({
      message: NODETYPE_ERRORS[preparedData.payload.nodeType.error]
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
  const preparedData = Selectors.prepareToAddLink(getState(), pin1, pin2);

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
  const projectState = Selectors.getProject(getState());
  const preparedData = Selectors.prepareToUpdateNodeProperty(
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
  const preparedData = Selectors.prepareToAddPatch(projectState, name, folderId);

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
  const projectState = Selectors.getProject(getState());
  const preparedData = Selectors.prepareToAddFolder(projectState, name, parentId);
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
