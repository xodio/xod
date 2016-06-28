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

export const deleteNode = (id) => ({
  type: ActionType.NODE_DELETE,
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
  const store = getState();
  const isSelected = Selectors.Editor.checkSelection(store.editor, 'Node', id);
  const result = [
    dispatch(deselectAll()),
  ];

  if (!isSelected) {
    result.push(dispatch(selectNode(id)));
  }

  return Promise.all(result);
};

export const clickPin = (id) => (dispatch, getState) => {
  const store = getState();
  const selected = Selectors.Editor.getSelectedIds(store.editor, 'Pin');
  const isSelected = Selectors.Editor.checkSelection(store.editor, 'Pin', id);
  const result = [
    dispatch(deselectAll()),
  ];

  if (selected.length === 1 && !isSelected) {
    const link = {
      fromPinId: parseInt(selected[0], 10),
      toPinId: id,
    };
    result.push(dispatch(addLink(link)));
  } else if (!isSelected) {
    result.push(dispatch(selectPin(id)));
  }

  return Promise.all(result);
};

export const clickLink = (id) => (dispatch, getState) => {
  const store = getState();
  const isSelected = Selectors.Editor.checkSelection(store.editor, 'Link', id);
  const result = [
    dispatch(deselectAll()),
  ];

  if (!isSelected) {
    result.push(dispatch(selectLink(id)));
  }

  return Promise.all(result);
};
