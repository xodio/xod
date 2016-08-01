import { NODE_MOVE, NODE_ADD, NODE_DELETE, NODE_UPDATE_PROPERTY } from '../actionTypes';
import R from 'ramda';
import { forThisPatch, isNodeInThisPatch } from '../utils/actions';

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

export const nodes = (state = {}, action, patchId) => {
  let movedNode = null;
  let newNode = null;
  let newNodeId = 0;

  switch (action.type) {

    case NODE_ADD: {
      if (!forThisPatch(action, patchId)) { return state; }

      const nodeType = action.payload.nodeType;
      const defaultProps = R.pipe(
        R.prop('properties'),
        R.values,
        R.reduce((p, prop) => R.assoc(prop.key, prop.defaultValue, p), {})
      )(nodeType);

      newNodeId = action.payload.newNodeId;
      newNode = R.set(R.lensProp('id'), newNodeId, {
        typeId: action.payload.typeId,
        position: action.payload.position,
        properties: defaultProps,
      });

      return R.set(R.lensProp(newNodeId), newNode, state);
    }
    case NODE_DELETE:
      if (!isNodeInThisPatch(state, action.payload.id)) { return state; }

      return R.omit([action.payload.id.toString()], state);

    case NODE_MOVE:
      if (!isNodeInThisPatch(state, action.payload.id)) { return state; }

      movedNode = node(R.prop(action.payload.id, state), action);
      return R.set(R.lensProp(action.payload.id), movedNode, state);

    case NODE_UPDATE_PROPERTY:
      if (!isNodeInThisPatch(state, action.payload.id)) { return state; }

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
