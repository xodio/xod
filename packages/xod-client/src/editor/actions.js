import R from 'ramda';

import { EDITOR_MODE, SELECTION_ENTITY_TYPE } from './constants';
import * as ActionType from './actionTypes';
import * as Selectors from './selectors';
import * as ProjectSelectors from '../project/selectors';

import { isLinkSelected, isNodeSelected, isCommentSelected } from './utils';
import {
  getRenderablePin,
  getPinSelectionError,
  getLinkingError,
} from '../project/utils';

import {
  addNode,
  addLink,
  deleteNode,
  deleteLink,
  deleteComment,
} from '../project/actions';
import {
  addError,
} from '../messages/actions';

import { LINK_ERRORS } from '../messages/constants';

export const setNodeSelection = id => ({
  type: ActionType.EDITOR_SELECT_NODE,
  payload: {
    id,
  },
});

export const setLinkSelection = id => ({
  type: ActionType.EDITOR_SELECT_LINK,
  payload: {
    id,
  },
});

export const setCommentSelection = id => ({
  type: ActionType.EDITOR_SELECT_COMMENT,
  payload: {
    id,
  },
});

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

const doPinSelection = (nodeId, pinKey) => (dispatch, getState) => {
  const selectedPin = getRenderablePin(
    nodeId,
    pinKey,
    ProjectSelectors.getRenderableNodes(getState())
  );

  const err = getPinSelectionError(selectedPin);

  if (err) {
    dispatch(addError(LINK_ERRORS[err]));
    return;
  }

  dispatch(setMode(EDITOR_MODE.LINKING));
  dispatch(setPinSelection(nodeId, pinKey));
};

export const deselectAll = () => (dispatch, getState) => {
  const state = getState();
  if (!Selectors.hasSelection(state)) { return; }

  dispatch({
    type: ActionType.EDITOR_DESELECT_ALL,
    payload: {},
  });
  if (!Selectors.getModeChecks(state).isDefault) {
    dispatch(setMode(EDITOR_MODE.DEFAULT));
  }
};

export const selectNode = id => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.getSelection(state);
  const isSelected = isNodeSelected(selection, id);

  if (!isSelected) {
    dispatch(deselectAll());
    dispatch(setNodeSelection(id));
  }
};

export const selectComment = id => (dispatch, getState) => {
  // TODO: remove code duplication, move selection uniqueness check to reducer
  const state = getState();
  const selection = Selectors.getSelection(state);
  const isSelected = isCommentSelected(selection, id);

  if (!isSelected) {
    dispatch(deselectAll());
    dispatch(setCommentSelection(id));
  }
};

export const addAndSelectNode = (typeId, position, currentPatchPath) => (dispatch) => {
  const newId = dispatch(addNode(typeId, position, currentPatchPath));
  dispatch(setMode(EDITOR_MODE.DEFAULT));
  dispatch(selectNode(newId));
};

export const linkPin = (nodeId, pinKey) => (dispatch, getState) => {
  const state = getState();
  const linkingFrom = state.editor.linkingPin;

  dispatch(deselectAll());

  if (!linkingFrom) {
    dispatch(doPinSelection(nodeId, pinKey));
    return;
  }

  const linkingTo = { nodeId, pinKey };

  if (R.equals(linkingFrom, linkingTo)) {
    // linking a pin to itself
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

  const action = error ?
    addError(LINK_ERRORS[error]) :
    addLink(linkingFrom, linkingTo);
  dispatch(setMode(EDITOR_MODE.DEFAULT));
  dispatch(action);
};

export const selectLink = id => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.getSelection(state);
  const isSelected = isLinkSelected(selection, id);
  const deselect = dispatch(deselectAll());
  const result = [];
  if (deselect) {
    result.push(deselect);
  }

  if (!isSelected) {
    result.push(dispatch(setLinkSelection(id)));
  }

  return result;
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
  const currentPatchPath = Selectors.getCurrentPatchPath(getState());
  const selection = Selectors.getSelection(getState());

  selection.forEach((select) => {
    dispatch(
      DELETE_ACTIONS[select.entity](select.id, currentPatchPath)
    );
  });
};

export const switchPatch = patchPath => (dispatch, getState) => {
  if (Selectors.getCurrentPatchPath(getState()) === patchPath) { return; }

  dispatch(deselectAll());
  dispatch({
    type: ActionType.EDITOR_SWITCH_PATCH,
    payload: {
      patchPath,
    },
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
