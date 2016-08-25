import { NODE_MOVE, NODE_ADD, NODE_DELETE, NODE_UPDATE_PROPERTY } from '../actionTypes';
import { PROPERTY_TYPE_PARSE } from '../constants';
import R from 'ramda';

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

const parseVal = (val, type) => {
  if (type && PROPERTY_TYPE_PARSE.hasOwnProperty(type)) {
    return PROPERTY_TYPE_PARSE[type](val);
  }

  return val;
};

export const nodes = (state = {}, action) => {
  let movedNode = null;
  let newNode = null;
  let newNodeId = 0;

  switch (action.type) {

    case NODE_ADD: {
      const nodeType = action.payload.nodeType;
      const defaultProps = R.pipe(
        R.prop('properties'),
        R.values,
        R.reduce(
          (p, prop) => R.assoc(
            prop.key,
            parseVal(prop.defaultValue, prop.type),
            p
          ),
          {}
        )
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
      return R.omit([action.payload.id.toString()], state);

    case NODE_MOVE:
      movedNode = node(R.prop(action.payload.id, state), action);
      return R.set(R.lensProp(action.payload.id), movedNode, state);

    case NODE_UPDATE_PROPERTY:
      return R.set(
        R.lensPath([
          action.payload.id,
          'properties',
          action.payload.key,
        ]),
        parseVal(action.payload.value, action.payload.type)
      )(state);

    default:
      return state;
  }
};
