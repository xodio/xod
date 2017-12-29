import * as R from 'ramda';
import * as XP from 'xod-project';
import { publish } from 'xod-pm';

import { foldMaybe, rejectWithCode } from 'xod-func-tools';

import { addConfirmation, addError } from '../messages/actions';
import { NODETYPE_ERROR_TYPES } from '../editor/constants';
import { PROJECT_BROWSER_ERRORS } from '../projectBrowser/messages';
import * as ActionType from './actionTypes';
import { isPatchPathTaken } from './utils';
import { getCurrentPatchPath } from '../editor/selectors';
import { getGrant } from '../user/selectors';
import { fetchGrant } from '../user/actions';
import { LOG_IN_TO_CONTINUE } from '../user/messages';
import { AUTHORIZATION_NEEDED } from '../user/errorCodes';
import { SUCCESSFULLY_PUBLISHED, NODETYPE_ERRORS } from './messages';
import { getProject } from './selectors';
import { getPmSwaggerUrl } from '../utils/urls';
import composeMessage from '../messages/composeMessage';

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

export const requestPublishProject = () => (dispatch, getState) => {
  const isAuthorized = foldMaybe(false, R.T, getGrant(getState()));

  if (!isAuthorized) {
    dispatch(addError(LOG_IN_TO_CONTINUE));
    // TODO: open account pane?
    return;
  }

  dispatch({ type: ActionType.PROJECT_PUBLISH_REQUESTED });
};

export const cancelPublishingProject = () => ({
  type: ActionType.PROJECT_PUBLISH_CANCELLED,
});

export const publishProject = () => (dispatch, getState) => {
  const state = getState();
  const project = getProject(state);

  dispatch({ type: ActionType.PROJECT_PUBLISH_START });

  dispatch(fetchGrant()) // to obtain freshest auth token
    .then((freshGrant) => {
      if (freshGrant === null) {
        // could happen if user logs out in another tab
        return rejectWithCode(
          AUTHORIZATION_NEEDED,
          new Error(LOG_IN_TO_CONTINUE)
        );
      }

      return publish(getPmSwaggerUrl(), freshGrant, project);
    })
    .then(() => {
      dispatch(addConfirmation(SUCCESSFULLY_PUBLISHED));
      dispatch({ type: ActionType.PROJECT_PUBLISH_SUCCESS });
    })
    .catch((err) => {
      dispatch({ type: ActionType.PROJECT_PUBLISH_FAIL });
      dispatch(addError(composeMessage(err.message)));
    });
};

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

export const updatePatchImplementation = (patchPath, newSource) => ({
  type: ActionType.PATCH_NATIVE_IMPLEMENTATION_UPDATE,
  payload: {
    patchPath,
    newSource,
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

//
// Comment
//
export const addComment = () => (dispatch, getState) =>
  dispatch({ // TODO: where to provide initial size, position and content?
    type: ActionType.COMMENT_ADD,
    payload: {
      patchPath: getCurrentPatchPath(getState()),
    },
  });

export const resizeComment = (id, size) => (dispatch, getState) =>
  dispatch({
    type: ActionType.COMMENT_RESIZE,
    payload: {
      id,
      size,
      patchPath: getCurrentPatchPath(getState()),
    },
  });

export const editComment = (id, content) => (dispatch, getState) =>
  dispatch({
    type: ActionType.COMMENT_SET_CONTENT,
    payload: {
      id,
      content,
      patchPath: getCurrentPatchPath(getState()),
    },
  });

export const bulkMoveNodesAndComments = (nodeIds, commentIds, deltaPosition, patchPath) => ({
  type: ActionType.BULK_MOVE_NODES_AND_COMMENTS,
  payload: {
    nodeIds,
    commentIds,
    deltaPosition,
    patchPath,
  },
});

// TODO: move to xod-project?
const isNodeWithIdInUse = R.curry((project, patchPath, nodeId) => {
  const patch = XP.getPatchByPathUnsafe(patchPath, project);
  const node = XP.getNodeByIdUnsafe(nodeId, patch);

  return XP.isPinNode(node) && XP.isTerminalNodeInUse(nodeId, patchPath, project);
});

export const bulkDeleteNodesAndComments =
  (nodeIds, linkIds, commentIds, patchPath) => (dispatch, getState) => {
    const state = getState();
    const project = getProject(state);

    if (R.any(isNodeWithIdInUse(project, patchPath), nodeIds)) {
      return dispatch(
        addError(NODETYPE_ERRORS[NODETYPE_ERROR_TYPES.CANT_DELETE_USED_PIN_OF_PATCHNODE])
      );
    }

    return dispatch({
      type: ActionType.BULK_DELETE_ENTITIES,
      payload: {
        nodeIds,
        linkIds,
        commentIds,
        patchPath,
      },
    });
  };
