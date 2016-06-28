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
  type: ActionType.PIN_SELECT,
  payload: {
    id,
  },
});

export const clickPin = (id) => (dispatch, getState) => {
  const store = getState();
  let result;

  if (store.editor.selectedPin) {
    const pinIds = R.concat(store.editor.selectedPin, id);
    result = dispatch(addLink, pinIds);
  } else {
    result = dispatch(selectPin, id);
  }

  return result;
};
