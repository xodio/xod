import { generateId, isValidIdentifier, getLocalPath } from 'xod-project';

import { addError } from '../messages/actions';
import { PROJECT_BROWSER_ERRORS } from '../messages/constants';
import * as ActionType from './actionTypes';
import { isPatchPathTaken } from './utils';
import { getCurrentPatchPath } from '../editor/selectors';

export const createProject = projectName => (dispatch) => {
  if (!isValidIdentifier(projectName)) {
    return dispatch(addError(PROJECT_BROWSER_ERRORS.INVALID_PROJECT_NAME));
  }

  return dispatch({
    type: ActionType.PROJECT_CREATE,
    payload: {
      name: projectName,
      mainPatchPath: getLocalPath('main'),
    },
  });
};

export const addNode = (typeId, position, patchPath) => (dispatch) => {
  const newNodeId = generateId();

  dispatch({
    type: ActionType.NODE_ADD,
    payload: {
      typeId,
      position,
      newNodeId,
      patchPath,
    },
  });

  return newNodeId;
};

export const deleteNode = id => (dispatch, getState) => {
  const patchPath = getCurrentPatchPath(getState());

  dispatch({
    type: ActionType.NODE_DELETE,
    payload: {
      id,
      patchPath,
    },
  });
};

export const moveNode = (id, position) => (dispatch, getState) => {
  const patchPath = getCurrentPatchPath(getState());

  dispatch({
    type: ActionType.NODE_MOVE,
    payload: {
      id,
      position,
      patchPath,
    },
  });
};

export const addLink = (pin1, pin2) => (dispatch, getState) => {
  const patchPath = getCurrentPatchPath(getState());

  dispatch({
    type: ActionType.LINK_ADD,
    payload: {
      patchPath,
      pins: [pin1, pin2],
    },
  });
};

export const deleteLink = (id, patchPath) => ({
  type: ActionType.LINK_DELETE,
  payload: {
    id,
    patchPath,
  },
});

export const updateNodeProperty =
  (nodeId, propKind, propKey, propValue) => (dispatch, getState) => {
    const patchPath = getCurrentPatchPath(getState());

    dispatch({
      type: ActionType.NODE_UPDATE_PROPERTY,
      payload: {
        id: nodeId,
        kind: propKind,
        key: propKey,
        value: propValue,
        patchPath,
      },
    });
  };

export const openProject = project => ({
  type: ActionType.PROJECT_OPEN,
  payload: project,
});

export const importProject = json => ({
  type: ActionType.PROJECT_IMPORT,
  payload: json,
});

export const openWorkspace = libs => ({
  type: ActionType.PROJECT_OPEN_WORKSPACE,
  payload: libs,
});

export const undoPatch = patchPath => ({
  type: ActionType.PATCH_HISTORY_UNDO,
  payload: { patchPath },
});

export const redoPatch = patchPath => ({
  type: ActionType.PATCH_HISTORY_REDO,
  payload: { patchPath },
});

export const addPatch = baseName => (dispatch, getState) => {
  if (!isValidIdentifier(baseName)) {
    return dispatch(addError(PROJECT_BROWSER_ERRORS.INVALID_PATCH_NAME));
  }

  const state = getState();
  const newPatchPath = getLocalPath(baseName);

  if (isPatchPathTaken(state, newPatchPath)) {
    return dispatch(addError(PROJECT_BROWSER_ERRORS.PATCH_NAME_TAKEN));
  }

  return dispatch({
    type: ActionType.PATCH_ADD,
    payload: {
      patchPath: newPatchPath,
    },
  });
};

export const renamePatch = (oldPatchPath, newBaseName) => (dispatch, getState) => {
  const newPatchPath = getLocalPath(newBaseName);
  const state = getState();

  if (
    newPatchPath !== oldPatchPath &&
    isPatchPathTaken(state, newPatchPath)
  ) {
    return dispatch(addError(PROJECT_BROWSER_ERRORS.PATCH_NAME_TAKEN));
  }

  return dispatch({
    type: ActionType.PATCH_RENAME,
    payload: {
      newPatchPath,
      oldPatchPath,
    },
  });
};

export const deletePatch = patchPath => ({
  type: ActionType.PATCH_DELETE,
  payload: {
    patchPath,
  },
});

export const renameProject = name => ({
  type: ActionType.PROJECT_RENAME,
  payload: name,
});
