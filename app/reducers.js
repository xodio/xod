import * as Actions from './actions.js';
import { combineReducers } from 'redux'
import { initialState } from './state.js';
import update from 'react-addons-update';

const node = (state, action) => {
  switch (action.type) {
    case Actions.MOVE_NODE:
      return update(state, {
        position: action.position
      });
    case Actions.ADD_NODE:
      return action.node;
    case Actions.DELETE_NODE:
      return undefined;
  }
  return state;
};

export const nodes = (state, action) => {
  switch (action.type) {

    case Actions.ADD_NODE:
      const newNode = node(undefined, action);
      const newNodeId = Math.max(...Object.keys(state).map(parseInt));
      newNode.id = newNodeId;
      return update(state, {
        $merge: {
          newNode
        }
      });

    case Actions.DELETE_NODE:
      newState = React.addons.update({}, state);
      newState[action.id] = node(state[action.id], action);
      return newState;

    case Actions.MOVE_NODE:
      newState = React.addons.update({}, state);
      newState[action.id] = node(state[action.id], action);
      return newState;

    default:
      return state;
  }
};

export const nodeApp = combineReducers({
  nodes
});
