import R from 'ramda';
import * as ActionType from './actionTypes';
import Selectors from './selectors';

export const moveNode = (id, position) => ({
  type: ActionType.NODE_MOVE,
  payload: {
    id,
    position,
  },
});

export const dragNode = (id, position) => ({
  type: ActionType.NODE_MOVE,
  payload: {
    id,
    position,
  },
  meta: {
    skipHistory: true,
  },
});

export const addNode = (node) => ({
  type: ActionType.NODE_ADD,
  payload: node,
});

const deleteNodeAction = (id) => ({
  type: ActionType.NODE_DELETE,
  payload: {
    id,
  },
});

export const addPin = (nodeId, type, name) => ({
  type: ActionType.PIN_ADD,
  payload: {
    nodeId,
    type,
    name,
  },
});

export const deletePin = (id) => ({
  type: ActionType.PIN_DELETE,
  payload: {
    id,
  },
});

export const addLink = (link) => ({
  type: ActionType.LINK_ADD,
  payload: link,
});

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

export const deleteNode = (id) => (dispatch, getState) => {
  const state = getState().project;
  const result = [];

  // 1. getPinsByNodeId
  const pins = Selectors.Pin.getPinsByNodeId(state, { id });
  // 2. getLinksByPinId and delete them
  R.pipe(
    R.values,
    R.reduce((prev, c) => {
      const pinLinks = Selectors.Link.getLinksByPinId(state, { pinIds: [c.id] });
      return R.concat(prev, pinLinks);
    }, []),
    R.forEach((link) => {
      result.push(dispatch(deleteLink(link.id)));
    })
  )(pins);
  // 3. delete all found pins
  R.pipe(
    R.values,
    R.forEach((pin) => {
      result.push(dispatch(deletePin(pin.id)));
    })
  )(pins);
  // 4. delete node
  result.push(dispatch(deleteNodeAction(id)));

  return result;
};

export const selectNode = (id) => ({
  type: ActionType.EDITOR_SELECT_NODE,
  payload: {
    id,
  },
  meta: {
    skipHistory: true,
  },
});

export const selectPin = (id) => ({
  type: ActionType.EDITOR_SELECT_PIN,
  payload: {
    id,
  },
  meta: {
    skipHistory: true,
  },
});

export const selectLink = (id) => ({
  type: ActionType.EDITOR_SELECT_LINK,
  payload: {
    id,
  },
  meta: {
    skipHistory: true,
  },
});

export const deselectAll = () => ({
  type: ActionType.EDITOR_DESELECT_ALL,
  payload: {},
  meta: {
    skipHistory: true,
  },
});

export const clickNode = (id) => (dispatch, getState) => {
  const state = getState();
  const isSelected = Selectors.Editor.checkSelection(state.editor, 'Node', id);
  const result = [
    dispatch(deselectAll()),
  ];

  if (!isSelected) {
    result.push(dispatch(selectNode(id)));
  }

  return result;
};

export const clickPin = (id) => (dispatch, getState) => {
  const state = getState();
  const selected = state.editor.selectedPin;
  const result = [
    dispatch(deselectAll()),
  ];

  if (selected && selected !== id) {
    const link = {
      fromPinId: selected,
      toPinId: id,
    };
    result.push(dispatch(addLink(link)));
  } else if (selected !== id) {
    result.push(dispatch(selectPin(id)));
  }

  return result;
};

export const clickLink = (id) => (dispatch, getState) => {
  const state = getState();
  const isSelected = Selectors.Editor.checkSelection(state.editor, 'Link', id);
  const result = [
    dispatch(deselectAll()),
  ];

  if (!isSelected) {
    result.push(dispatch(selectLink(id)));
  }

  return result;
};

