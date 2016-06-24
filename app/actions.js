import * as ActionType from './actionTypes';

export const nodeMove = (id, position) => ({
  type: ActionType.NODE_MOVE,
  id,
  position,
});

export const nodeDrag = (id, position) => ({
  type: ActionType.NODE_MOVE,
  id,
  position,
  skipHistory: true,
});

export const nodeAdd = (node) => ({
  type: ActionType.NODE_ADD,
  node,
});

export const nodeDelete = (id) => ({
  type: ActionType.NODE_DELETE,
  id,
});

export const metaUpdate = (data) => ({
  type: ActionType.META_UPDATE,
  data,
});

export const viewstateUpdate = (state) => ({
  type: ActionType.VIEWSTATE_UPDATE,
  state,
  skipHistory: true,
});
