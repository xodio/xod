import R from 'ramda';

import * as XP from 'xod-project';

import { EDITOR_MODE, SELECTION_ENTITY_TYPE } from './constants';
import * as ActionType from './actionTypes';
import * as Selectors from './selectors';
import * as ProjectSelectors from '../project/selectors';

import {
  getRenderablePin,
  getPinSelectionError,
  getLinkingError,
  getInitialPatchOffset,
  patchToNodeProps,
} from '../project/utils';

import { getSelectedEntityIdsOfType } from './utils';

import {
  addNode,
  addLink,
  deleteNode,
  deleteLink,
  deleteComment,
  bulkMoveNodesAndComments,
} from '../project/actions';
import {
  addError,
} from '../messages/actions';

import { LINK_ERRORS } from '../messages/constants';

export const setMode = mode => (dispatch, getState) => {
  if (Selectors.getMode(getState()) === mode) {
    return;
  }

  dispatch({
    type: ActionType.EDITOR_SET_MODE,
    payload: {
      mode,
    },
  });
};

export const setPinSelection = (nodeId, pinKey) => ({
  type: ActionType.EDITOR_SELECT_PIN,
  payload: {
    nodeId,
    pinKey,
  },
});

export const clearPinSelection = () => ({
  type: ActionType.EDITOR_DESELECT_PIN,
});

export const doPinSelection = (nodeId, pinKey) => (dispatch, getState) => {
  const selectedPin = getRenderablePin(
    nodeId,
    pinKey,
    ProjectSelectors.getRenderableNodes(getState())
  );

  const err = getPinSelectionError(selectedPin);

  if (err) {
    dispatch(addError(LINK_ERRORS[err]));
    return false;
  }

  dispatch(setPinSelection(nodeId, pinKey));
  return true;
};

export const deselectAll = () => (dispatch, getState) => {
  const state = getState();
  if (!Selectors.hasSelection(state)) { return; }

  dispatch({
    type: ActionType.EDITOR_DESELECT_ALL,
    payload: {},
  });
};

export const selectEntity = R.curry((entityType, id) => ({
  type: ActionType.EDITOR_SELECT_ENTITY,
  payload: { id, entityType },
}));

export const deselectEntity = R.curry((entityType, id) => ({
  type: ActionType.EDITOR_DESELECT_ENTITY,
  payload: { id, entityType },
}));

export const addEntityToSelection = R.curry((entityType, id) => ({
  type: ActionType.EDITOR_ADD_ENTITY_TO_SELECTION,
  payload: { id, entityType },
}));

export const selectNode = selectEntity(SELECTION_ENTITY_TYPE.NODE);
export const selectComment = selectEntity(SELECTION_ENTITY_TYPE.COMMENT);
export const selectLink = selectEntity(SELECTION_ENTITY_TYPE.LINK);

export const addAndSelectNode = (typeId, position, currentPatchPath) => (dispatch) => {
  const newId = dispatch(addNode(typeId, position, currentPatchPath));
  dispatch(setMode(EDITOR_MODE.DEFAULT));
  dispatch(selectNode(newId));
};

export const linkPin = (nodeId, pinKey) => (dispatch, getState) => {
  const state = getState();
  const linkingFrom = state.editor.linkingPin;

  if (!linkingFrom) return;

  const linkingTo = { nodeId, pinKey };

  if (R.equals(linkingFrom, linkingTo)) {
    // linking a pin to itself
    dispatch(clearPinSelection());
    return;
  }

  const nodes = ProjectSelectors.getRenderableNodes(state);
  const renderablePinFrom = getRenderablePin(
    linkingFrom.nodeId,
    linkingFrom.pinKey,
    nodes
  );
  const renderablePinTo = getRenderablePin(
    linkingTo.nodeId,
    linkingTo.pinKey,
    nodes
  );

  const error = getLinkingError(renderablePinFrom, renderablePinTo);

  if (error) {
    dispatch(addError(LINK_ERRORS[error]));
    dispatch(clearPinSelection());
  } else {
    dispatch(addLink(linkingFrom, linkingTo));
  }
};

export const setSelectedNodeType = id => ({
  type: ActionType.EDITOR_SET_SELECTED_NODETYPE,
  payload: {
    id,
  },
});

const DELETE_ACTIONS = {
  [SELECTION_ENTITY_TYPE.NODE]: deleteNode,
  [SELECTION_ENTITY_TYPE.COMMENT]: deleteComment,
  [SELECTION_ENTITY_TYPE.LINK]: deleteLink,
};

export const deleteSelection = () => (dispatch, getState) => {
  // TODO: sending a bunch of actions is suboptimal and pollutes undo history
  const currentPatchPath = Selectors.getCurrentPatchPath(getState());
  const selection = Selectors.getSelection(getState());

  selection.forEach((select) => {
    dispatch(
      DELETE_ACTIONS[select.entity](select.id, currentPatchPath)
    );
  });
};

export const moveSelection = deltaPosition => (dispatch, getState) => {
  const state = getState();
  const currentPatchPath = Selectors.getCurrentPatchPath(state);
  const selection = Selectors.getSelection(state);

  dispatch(bulkMoveNodesAndComments(
    getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.NODE, selection),
    getSelectedEntityIdsOfType(SELECTION_ENTITY_TYPE.COMMENT, selection),
    deltaPosition,
    currentPatchPath
  ));
};

export const setCurrentPatchOffset = newOffset => ({
  type: ActionType.SET_CURRENT_PATCH_OFFSET,
  payload: newOffset,
});

export const switchPatch = patchPath => (dispatch, getState) => {
  const state = getState();
  const currentPatchPath = Selectors.getCurrentPatchPath(state);

  if (currentPatchPath === patchPath) { return; }

  const tabs = Selectors.getTabs(state);
  const isOpeningNewTab = !R.has(patchPath, tabs);
  dispatch({
    type: ActionType.EDITOR_SWITCH_PATCH,
    payload: {
      patchPath,
    },
  });

  if (isOpeningNewTab) {
    const project = ProjectSelectors.getProject(state);
    const offset = getInitialPatchOffset(patchPath, project);

    dispatch(setCurrentPatchOffset(offset));
  }
};

export const startDraggingPatch = patchPath => (dispatch, getState) => {
  const state = getState();

  const previewSize = R.compose(
    R.prop('size'),
    patchToNodeProps,
    XP.getPatchByPathUnsafe(patchPath),
    ProjectSelectors.getProject
  )(state);

  dispatch({
    type: ActionType.START_DRAGGING_PATCH,
    payload: previewSize,
  });
};

export const closeTab = id => ({
  type: ActionType.TAB_CLOSE,
  payload: {
    id,
  },
});

export const sortTabs = newOrderObject => ({
  type: ActionType.TAB_SORT,
  payload: newOrderObject,
});

export const toggleHelpbar = () => ({
  type: ActionType.TOGGLE_HELPBAR,
});

export const setFocusedArea = area => ({
  type: ActionType.SET_FOCUSED_AREA,
  payload: area,
});

export const showSuggester = placePosition => ({
  type: ActionType.SHOW_SUGGESTER,
  payload: placePosition,
});

export const hideSuggester = () => ({
  type: ActionType.HIDE_SUGGESTER,
});

export const highlightSugessterItem = patchPath => ({
  type: ActionType.HIGHLIGHT_SUGGESTER_ITEM,
  payload: {
    patchPath,
  },
});
