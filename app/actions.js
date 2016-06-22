export const NODE_MOVE = 'MOVE_NODE';
export const NODE_ADD = 'ADD_NODE';
export const NODE_DELETE = 'DELETE_NODE';

export const moveNode = (id, position) => ({
  type: NODE_MOVE,
  payload: {
    id,
    position,
  },
});

export const addNode = (node) => ({
  type: NODE_ADD,
  payload: node,
});

export const deleteNode = (id) => ({
  type: NODE_DELETE,
  payload: {
    id,
  },
});
