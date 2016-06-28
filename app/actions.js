import R from 'ramda';
import * as ActionType from './actionTypes';

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

const selectPin = (id) => ({
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

export const clickPin = (id) => (dispatch, getState) => {
  const store = getState();
  const selectedId = store.editor.selectedPin;
  const result = [
    dispatch(deselectAll()),
  ];

  if (selectedId && selectedId !== id) {
    const link = {
      fromPinId: store.editor.selectedPin,
      toPinId: id,
    };
    result.push(dispatch(addLink(link)));
  } else if (selectedId !== id) {
    result.push(dispatch(selectPin(id)));
  }

  return Promise.all(result);
};
