import R from 'ramda';

import { EDITOR_MODE } from './constants';
import * as ActionType from './actionTypes';
import * as Selectors from './selectors';

import * as SelectorsProject from 'xod/client/project/selectors';
import {
  addNode,
  addLink,
  deleteNode,
  deleteLink,
} from 'xod/client/project/actions';
import {
  addError,
} from 'xod/client/messages/actions';

export const setNodeSelection = (id) => ({
  type: ActionType.EDITOR_SELECT_NODE,
  payload: {
    id,
  },
});

export const setPinSelection = (nodeId, pinKey) => ({
  type: ActionType.EDITOR_SELECT_PIN,
  payload: {
    nodeId,
    pinKey,
  },
});

export const setLinkSelection = (id) => ({
  type: ActionType.EDITOR_SELECT_LINK,
  payload: {
    id,
  },
});

export const setMode = (mode) => (dispatch, getState) => {
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

export const selectNode = (id) => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.getSelection(state);
  const isSelected = Selectors.isNodeSelected(selection, id);
  const deselect = dispatch(deselectAll());
  const result = [];
  if (deselect) {
    result.push(deselect);
  }

  if (!isSelected) {
    result.push(dispatch(setNodeSelection(id)));
  }

  return result;
};

export const addAndSelectNode = (typeId, position, curPatchId) => (dispatch, getState) => {
  dispatch(addNode(typeId, position, curPatchId));
  dispatch(setMode(EDITOR_MODE.DEFAULT));

  const newId = SelectorsProject.getLastNodeId(getState());
  dispatch(selectNode(newId));
};

export const linkPin = (nodeId, pinKey) => (dispatch, getState) => {
  const data = {
    nodeId,
    pinKey,
  };
  const state = getState();
  const selected = state.editor.linkingPin;
  const deselect = dispatch(deselectAll());
  const result = [];
  if (deselect) {
    result.push(deselect);
  }

  const pins = [selected, data];

  if (R.equals(selected, data)) {
    // linking a pin to itself
    return result;
  }

  let action;

  if (selected) {
    const validation = SelectorsProject.validateLink(state, pins);
    action = validation.isValid ?
      addLink(pins[0], pins[1]) :
      addError({ message: validation.message });
    dispatch(setMode(EDITOR_MODE.DEFAULT));
  } else {
    dispatch(setMode(EDITOR_MODE.LINKING));
    action = setPinSelection(nodeId, pinKey);
  }

  return R.append(dispatch(action), result);
};

export const selectLink = (id) => (dispatch, getState) => {
  const state = getState();
  const selection = Selectors.getSelection(state);
  const isSelected = Selectors.isLinkSelected(selection, id);
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

export const setSelectedNodeType = (id) => ({
  type: ActionType.EDITOR_SET_SELECTED_NODETYPE,
  payload: {
    id,
  },
});

export const deleteSelection = () => (dispatch, getState) => {
  const selection = Selectors.getSelection(getState());
  const DELETE_ACTIONS = {
    Node: deleteNode,
    Link: deleteLink,
  };

  selection.forEach((select) => {
    dispatch(
      DELETE_ACTIONS[select.entity](select.id)
    );
  });
};

export const switchPatch = (id) => (dispatch, getState) => {
  if (Selectors.getCurrentPatchId(getState()) === id) { return; }

  dispatch(deselectAll());
  dispatch({
    type: ActionType.EDITOR_SWITCH_PATCH,
    payload: {
      id,
    },
  });
};

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
