import { NODE_MOVE, NODE_ADD, NODE_DELETE, NODE_UPDATE_PROPERTY } from '../actionTypes';
import R from 'ramda';
import { getNodeTypes, getLastNodeId } from '../selectors/project';
import {
  isActionForCurrentPatch,
  currentStateHasThatNode,
} from '../utils/reducerUtils';

export const copyNode = (node) => R.clone(node);

const node = (state, action) => {
  switch (action.type) {
    case NODE_MOVE:
      return R.set(R.lensProp('position'), action.payload.position, state);
    case NODE_ADD:
      return R.prop('payload', action);
    default:
      return state;
  }
};

export const nodes = (state = {}, action, projectState) => {
  let movedNode = null;
  let newNode = null;
  let newNodeId = 0;

  switch (action.type) {

    case NODE_ADD: {
      if (!isActionForCurrentPatch(state, action, projectState)) { return state; }

      const nodeType = getNodeTypes(projectState)[action.payload.typeId];
      const defaultProps = R.pipe(
        R.prop('properties'),
        R.values,
        R.reduce((p, prop) => R.assoc(prop.key, prop.defaultValue, p), {})
      )(nodeType);

      newNodeId = getLastNodeId(projectState) + 1;
      newNode = R.set(R.lensProp('id'), newNodeId, {
        typeId: action.payload.typeId,
        position: action.payload.position,
        properties: defaultProps,
      });
      return R.set(R.lensProp(newNodeId), newNode, state);
    }
    case NODE_DELETE:
      return R.omit([action.payload.id.toString()], state);

    case NODE_MOVE:
      if (!currentStateHasThatNode(state, action.payload.id)) { return state; }

      movedNode = node(R.prop(action.payload.id, state), action);
      return R.set(R.lensProp(action.payload.id), movedNode, state);

    case NODE_UPDATE_PROPERTY:
      if (!currentStateHasThatNode(state, action.payload.id)) { return state; }

      return R.set(
        R.lensPath([
          action.payload.id,
          'properties',
          action.payload.key,
        ]),
        action.payload.value
      )(state);

    default:
      return state;
  }
};
