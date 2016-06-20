export const MOVE_NODE = 'MOVE_NODE';
export const ADD_NODE = 'ADD_NODE';
export const DELETE_NODE = 'DELETE_NODE';

export const moveNode = (id, position) => {
  return {
    type: MOVE_NODE,
    position
  }
};

export const addNode = (node) => {
  return {
    type: ADD_NODE,
    node: node
  }
};

export const deleteNode = (id) => {
  return {
    type: DELETE_NODE,
    id: id
  }
};
