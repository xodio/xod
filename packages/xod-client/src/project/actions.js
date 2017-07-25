import * as XP from 'xod-project';

import { addError } from '../messages/actions';
import { NODETYPE_ERROR_TYPES } from '../editor/constants';
import { PROJECT_BROWSER_ERRORS, NODETYPE_ERRORS } from '../messages/constants';
import * as ActionType from './actionTypes';
import { isPatchPathTaken } from './utils';
import { getCurrentPatchPath } from '../editor/selectors';
import { getProject } from './selectors';

//
// Project
//
export const requestCreateProject = () => ({
  type: ActionType.PROJECT_CREATE_REQUESTED,
  payload: {},
});

export const requestOpenProject = data => ({
  type: ActionType.PROJECT_OPEN_REQUESTED,
  payload: data,
});

export const createProject = projectName => (dispatch) => {
  if (!XP.isValidIdentifier(projectName)) {
    return dispatch(addError(PROJECT_BROWSER_ERRORS.INVALID_PROJECT_NAME));
  }

  return dispatch({
    type: ActionType.PROJECT_CREATE,
    payload: {
      name: projectName,
      mainPatchPath: XP.getLocalPath('main'),
    },
  });
};

export const updateProjectMeta = ({ license, description, version }) => ({
  type: ActionType.PROJECT_UPDATE_META,
  payload: {
    license,
    description,
    version,
  },
});

export const openProject = project => ({
  type: ActionType.PROJECT_OPEN,
  payload: project,
});

export const importProject = project => ({
  type: ActionType.PROJECT_IMPORT,
  payload: project,
});

export const renameProject = name => ({
  type: ActionType.PROJECT_RENAME,
  payload: name,
});

export const openWorkspace = libs => ({
  type: ActionType.PROJECT_OPEN_WORKSPACE,
  payload: libs,
});

//
// Patch
//
export const undoPatch = patchPath => ({
  type: ActionType.PATCH_HISTORY_UNDO,
  payload: { patchPath },
});

export const redoPatch = patchPath => ({
  type: ActionType.PATCH_HISTORY_REDO,
  payload: { patchPath },
});

export const addPatch = baseName => (dispatch, getState) => {
  if (!XP.isValidIdentifier(baseName)) {
    return dispatch(addError(PROJECT_BROWSER_ERRORS.INVALID_PATCH_NAME));
  }

  const state = getState();
  const newPatchPath = XP.getLocalPath(baseName);

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
  const newPatchPath = XP.getLocalPath(newBaseName);
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

export const updatePatchDescription = (patchDescription, patchPath) => ({
  type: ActionType.PATCH_DESCRIPTION_UPDATE,
  payload: {
    path: patchPath,
    description: patchDescription,
  },
});

//
// Node
//
export const addNode = (typeId, position, patchPath) => (dispatch) => {
  const newNodeId = XP.generateId();

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
  const state = getState();
  const project = getProject(state);
  const patchPath = getCurrentPatchPath(state);
  const patch = XP.getPatchByPathUnsafe(patchPath, project);
  const node = XP.getNodeByIdUnsafe(id, patch);

  // TODO: most of this probably should be moved to xod-project
  if (
    XP.isPinNode(node) &&
    XP.isTerminalNodeInUse(id, patchPath, project)
  ) {
    return dispatch(
      addError(NODETYPE_ERRORS[NODETYPE_ERROR_TYPES.CANT_DELETE_USED_PIN_OF_PATCHNODE])
    );
  }

  return dispatch({
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

//
// Link
//
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
