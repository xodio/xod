import * as Actions from './actions.js';
import { combineReducers } from 'redux'
import { initialState } from './state.jsx';

const node = (state, action) => {
  switch (action.type) {
    case Actions.MOVE_NODE:
      state = Object.assign({}, action.position);
      return state;
    case Actions.ADD_NODE:
      return action.node;
    case Actions.DELETE_NODE:
      return undefined;
  }
  return state;
};

const nodes = (state, action) => {
  let newState = state;
  switch (action.type) {

    case Actions.ADD_NODE:
      const newNode = node(undefined, action);
      newState = Object.assign({}, state);
      const newNodeId = Math.max(...Object.keys(state).map(parseInt));
      newNode.id = newNodeId;
      newState[newNodeId] = newNode;
      return newState;

    case Actions.DELETE_NODE:
      newState = Object.assign({}, state);
      newState[action.id] = node(state[action.id], action);
      return newState;

    case Actions.MOVE_NODE:
      newState = Object.assign({}, state);
      newState[action.id] = node(state[action.id], action);
      return newState;

    default:
      return state;
  }
};

export const nodeApp = combineReducers({
  nodes
});
