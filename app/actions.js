export const MOVE_NODE = 'MOVE_NODE';
export const ADD_NODE = 'ADD_NODE';
export const DELETE_NODE = 'DELETE_NODE';

export const moveNode = (id, position) => ({
  type: MOVE_NODE,
  id,
  position,
});

export const addNode = (node) => ({
  type: ADD_NODE,
  node,
});

export const deleteNode = (id) => ({
  type: DELETE_NODE,
  id,
});
