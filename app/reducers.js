import * as Actions from './actions.js';
import { combineReducers } from 'redux'
import update from 'react-addons-update';

export const newId = (nodes) => Math.max(...Object.keys(nodes).map(id => parseInt(id))) + 1;
export const lastId = (nodes) => Math.max(...Object.keys(nodes).map(id => parseInt(id)));
export const copyNode = (node) => update({}, {
  $merge: node
});

export const removeNode = (nodes, key) => {
  const nodesWithoutRemoved = Object.keys(nodes).filter(nodeId => nodeId !== key.toString()).map(nodeId => {
    return nodes[nodeId]
  });
  return nodesWithoutRemoved.reduce((newNodes, currentNode) => {
    "use strict";
    const temp = {};

    temp[currentNode.id] = currentNode;

    return update(newNodes, {
      $merge: temp
    });
  }, {});
};

const node = (state, action) => {
  switch (action.type) {
    case Actions.MOVE_NODE:
      return update(state, {
        position: action.position
      });
    case Actions.ADD_NODE:
      return action.node;
  }
  return state;
};

export const nodes = (state, action) => {
  let newState = state;
  let temp = null;

  switch (action.type) {

    case Actions.ADD_NODE:
      temp = {};
      const newNode = node(undefined, action);
      const newNodeId = newId(state);
      newNode.id = newNodeId;
      temp[newNode.id] = newNode;
      return update(state, {
        $merge: temp
      });

    case Actions.DELETE_NODE:
      return removeNode(state, action.id);

    case Actions.MOVE_NODE:
      newState = update({}, state);
      newState[action.id] = node(state[action.id], action);
      return newState;

    default:
      return newState;
  }
};

export const nodeApp = combineReducers({
  nodes
});
