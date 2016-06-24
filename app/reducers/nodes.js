import * as Actions from '../actions';
import update from 'react-addons-update';
import initialState from '../state';

export const newId = (nodes) => Math.max(...Object.keys(nodes).map(id => parseInt(id, 10))) + 1;
export const lastId = (nodes) => Math.max(...Object.keys(nodes).map(id => parseInt(id, 10)));
export const copyNode = (node) => update({}, {
  $merge: node,
});

export const removeNode = (nodes, key) => {
  const nodesWithoutRemoved = Object.keys(nodes).filter(nodeId => nodeId !== key.toString())
    .map(nodeId => nodes[nodeId]);
  return nodesWithoutRemoved.reduce((newNodes, currentNode) => {
    const temp = {};

    temp[currentNode.id] = currentNode;

    return update(newNodes, {
      $merge: temp,
    });
  }, {});
};

const node = (state, action) => {
  switch (action.type) {
    case Actions.NODE_MOVE:
      return update(state, {
        $merge: {
          position: action.position,
        },
      });
    case Actions.NODE_ADD:
      return action.node;
    default:
      return state;
  }
};

export const nodes = (state, action) => {
  let newState = (state === undefined) ? update(state, {
    $set: initialState.project.nodes,
  }) : state;
  let temp = null;
  let movedNode = null;
  let newNode = null;
  let newNodeId = 0;

  switch (action.type) {

    case Actions.NODE_ADD:
      temp = {};
      newNode = node(undefined, action);
      newNodeId = newId(state);
      newNode.id = newNodeId;
      temp[newNode.id] = newNode;
      return update(state, {
        $merge: temp,
      });

    case Actions.NODE_DELETE:
      return removeNode(state, action.id);

    case Actions.NODE_MOVE:
      temp = {};
      movedNode = node(state[action.id], action);
      temp[movedNode.id] = movedNode;
      newState = update(state, {
        $merge: temp,
      });
      return newState;

    default:
      return newState;
  }
};
