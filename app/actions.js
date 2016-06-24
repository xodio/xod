export const NODE_MOVE = 'NODE_MOVE';
export const NODE_ADD = 'NODE_ADD';
export const NODE_DELETE = 'NODE_DELETE';

export const nodeMove = (id, position) => ({
  type: NODE_MOVE,
  id,
  position,
});

export const nodeAdd = (node) => ({
  type: NODE_ADD,
  node,
});

export const nodeDelete = (id) => ({
  type: NODE_DELETE,
  id,
});