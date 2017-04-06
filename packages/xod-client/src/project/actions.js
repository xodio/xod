import { generateId } from 'xod-project';
import * as ActionType from './actionTypes';
import { getCurrentPatchId } from '../editor/selectors';

export const createProject = projectName => ({
  type: ActionType.PROJECT_CREATE,
  payload: {
    name: projectName,
    mainPatchId: '@/Main',
  },
});

export const addNode = (typeId, position, patchId) => (dispatch) => {
  const newNodeId = generateId();

  dispatch({
    type: ActionType.NODE_ADD,
    payload: {
      typeId,
      position,
      newNodeId,
      patchId,
    },
  });

  return newNodeId;
};

export const deleteNode = id => (dispatch, getState) => {
  const patchId = getCurrentPatchId(getState());

  dispatch({
    type: ActionType.NODE_DELETE,
    payload: {
      id,
      patchId,
    },
  });
};

export const moveNode = (id, position) => (dispatch, getState) => {
  const patchId = getCurrentPatchId(getState());

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: {
      id,
      position,
      patchId,
    },
  });
};

export const addLink = (pin1, pin2) => (dispatch, getState) => {
  const patchId = getCurrentPatchId(getState());

  dispatch({
    type: ActionType.LINK_ADD,
    payload: {
      patchId,
      pins: [pin1, pin2],
    },
  });
};

export const deleteLink = (id, patchId) => ({
  type: ActionType.LINK_DELETE,
  payload: {
    id,
    patchId,
  },
});

export const updateNodeProperty =
  (nodeId, propKind, propKey, propValue) => (dispatch, getState) => {
    const patchId = getCurrentPatchId(getState());

    dispatch({
      type: ActionType.NODE_UPDATE_PROPERTY,
      payload: {
        id: nodeId,
        kind: propKind,
        key: propKey,
        value: propValue,
        patchId,
      },
    });
  };

export const changePinMode = (nodeId, pinKey, injected, val = null) => (dispatch, getState) => {
  const patchId = getCurrentPatchId(getState());

  dispatch({
    type: ActionType.NODE_CHANGE_PIN_MODE,
    payload: {
      id: nodeId,
      key: pinKey,
      injected,
      value: val,
      patchId,
    },
  });
};

export const loadProject = project => ({
  type: ActionType.PROJECT_LOAD_DATA,
  payload: project,
});

export const loadProjectOnlyFromJSON = json => ({
  type: ActionType.PROJECT_ONLY_LOAD_DATA,
  payload: json,
});


export const undoPatch = patchId => ({
  type: ActionType.PATCH_HISTORY_UNDO,
  payload: { patchId },
});

export const redoPatch = patchId => ({
  type: ActionType.PATCH_HISTORY_REDO,
  payload: { patchId },
});

export const addPatch = label => ({
  type: ActionType.PATCH_ADD,
  payload: {
    id: `@/${generateId()}`, // TODO: we must ask user for _this_ instead of a label
    label,
  },
});

export const renamePatch = (patchId, label) => ({
  type: ActionType.PATCH_RENAME,
  payload: {
    label,
    patchId,
  },
});

export const deletePatch = id => ({
  type: ActionType.PATCH_DELETE,
  payload: {
    id,
  },
});

export const renameProject = name => ({
  type: ActionType.PROJECT_RENAME,
  payload: name,
});
