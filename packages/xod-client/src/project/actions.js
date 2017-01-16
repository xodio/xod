import core from 'xod-core';
import * as ActionType from './actionTypes';
import * as PrepareTo from './actionPreparations';
import { addError } from '../messages/actions';
import { PROPERTY_ERRORS, NODETYPE_ERRORS } from '../messages/constants';

export const createProject = projectName => ({
  type: ActionType.PROJECT_CREATE,
  payload: {
    name: projectName,
    mainPatchId: `@/${core.generateId()}`,
  },
});

export const moveNode = (id, position) => (dispatch, getState) => {
  const projectState = core.getProject(getState());
  const preparedData = PrepareTo.moveNode(projectState, id, position);

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const dragNode = (id, position) => (dispatch, getState) => {
  const projectState = core.getProject(getState());
  const preparedData = PrepareTo.dragNode(projectState, id, position);

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });
};

export const addNode = (typeId, position, patchId) => (dispatch, getState) => {
  const projectState = core.getProject(getState());
  const preparedData = PrepareTo.addNode(projectState, typeId, position, patchId);

  dispatch({
    type: ActionType.NODE_ADD,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });

  return preparedData.payload.newNodeId;
};

export const deleteNode = id => (dispatch, getState) => {
  const projectState = core.getProject(getState());
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
    const errorMessage = PROPERTY_ERRORS[preparedData.error];
    dispatch(addError({
      message: errorMessage,
    }));
    return new Error(errorMessage);
  }

  dispatch({
    type: ActionType.LINK_ADD,
    payload: preparedData.payload,
    meta: preparedData.meta,
  });

  return preparedData.payload.newId;
};

export const deleteLink = id => ({
  type: ActionType.LINK_DELETE,
  payload: {
    id,
  },
});

export const updateMeta = data => ({
  type: ActionType.META_UPDATE,
  payload: data,
});

export const updateNodeProperty =
  (nodeId, propKind, propKey, propValue) => (dispatch, getState) => {
    const projectState = core.getProject(getState());
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

export const changePinMode = (nodeId, pinKey, injected, val = null) => (dispatch, getState) => {
  const projectState = core.getProject(getState());
  const preparedData = PrepareTo.changePinMode(
    projectState,
    nodeId,
    pinKey,
    injected,
    val
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

export const loadProjectFromJSON = json => ({
  type: ActionType.PROJECT_LOAD_DATA,
  payload: json,
});

export const loadProjectOnlyFromJSON = json => ({
  type: ActionType.PROJECT_ONLY_LOAD_DATA,
  payload: json,
});


export const undoPatch = id => ({
  type: ActionType.getPatchUndoType(id),
  payload: {},
});

export const redoPatch = id => ({
  type: ActionType.getPatchRedoType(id),
  payload: {},
});

export const clearHistoryPatch = id => ({
  type: ActionType.getPatchClearHistoryType(id),
  payload: {},
});

export const addPatch = (label, folderId) => (dispatch, getState) => {
  const projectState = core.getProject(getState());
  const preparedData = PrepareTo.addPatch(projectState, label, folderId);

  dispatch({
    type: ActionType.PATCH_ADD,
    payload: preparedData,
  });

  return preparedData.newId;
};

export const renamePatch = (id, label) => ({
  type: ActionType.PATCH_RENAME,
  payload: {
    label,
  },
  meta: {
    patchId: id,
  },
});

export const deletePatch = id => ({
  type: ActionType.PATCH_DELETE,
  payload: {
    id,
  },
});

export const movePatch = changes => ({
  type: ActionType.PATCH_MOVE,
  payload: {
    id: changes.id,
    folderId: changes.folderId,
  },
  meta: {
    patchId: changes.id,
  },
});

export const renameProject = name => ({
  type: ActionType.PROJECT_RENAME,
  payload: name,
});

export const addFolder = (name, parentId) => (dispatch, getState) => {
  const projectState = core.getProject(getState());
  const preparedData = PrepareTo.addFolder(projectState, name, parentId);
  dispatch({
    type: ActionType.FOLDER_ADD,
    payload: preparedData,
  });
  return preparedData.newId;
};

export const renameFolder = (id, name) => ({
  type: ActionType.FOLDER_RENAME,
  payload: {
    id,
    name,
  },
});

export const deleteFolder = id => (dispatch, getState) => {
  const folders = core.getFoldersByFolderId(getState(), id);
  const patches = core.getPatchesByFolderId(getState(), id);

  folders.forEach(folder => dispatch(deleteFolder(folder.id)));
  patches.forEach(patch => dispatch(deletePatch(patch.id)));
  dispatch({
    type: ActionType.FOLDER_DELETE,
    payload: {
      id,
    },
  });
};

export const moveFolder = changes => ({
  type: ActionType.FOLDER_MOVE,
  payload: {
    id: changes.id,
    parentId: changes.parentId,
  },
});

export const updateNodeTypes = nodeTypes => ({
  type: ActionType.NODETYPES_UPDATE,
  payload: {
    nodeTypes,
  },
});
