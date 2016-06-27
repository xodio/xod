import * as ActionType from '../actionTypes';
import R from 'ramda';

const nodeIds = (nodes) =>
    R.map(node => parseInt(node.id, 10))(R.values(nodes));

export const lastId = (nodes) => {
  const ids = nodeIds(nodes);
  // -1 is important because if nodes store doesn't contain nodes then we should return 0 as newId
  return R.reduce(R.max, -1, ids);
};

export const newId = (nodes) => lastId(nodes) + 1;

export const copyNode = (node) => R.clone(node);

const node = (state, action) => {
  switch (action.type) {
    case ActionType.NODE_MOVE:
      return R.set(R.lensProp('position'), action.payload.position, state);
    case ActionType.NODE_ADD:
      return R.view(R.lensProp('payload'), action);
    default:
      return state;
  }
};

export const nodes = (state = {}, action) => {
  let movedNode = null;
  let newNode = null;
  let newNodeId = 0;

  switch (action.type) {

    case ActionType.NODE_ADD:
      newNode = node(undefined, action);
      newNodeId = newId(state);
      newNode = R.set(R.lensProp('id'), newNodeId, newNode);
      return R.set(R.lensProp(newNodeId), newNode, state);

    case ActionType.NODE_DELETE:
      return R.omit([action.payload.id.toString()], state);

    case ActionType.NODE_MOVE:
      movedNode = node(R.view(R.lensProp(action.payload.id), state), action);
      return R.set(R.lensProp(action.payload.id), movedNode, state);

    default:
      return state;
  }
};
