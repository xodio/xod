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

const getPropertyPath = (payload) => {
  const path = [
    payload.id,
    payload.kind,
    payload.key,
  ];

  if (payload.kind === 'pins') {
    path.push('value');
  }

  return path;
};

const getNodePins = R.pipe(
  R.path(['payload', 'nodeType', 'pins']),
  R.mapObjIndexed(R.pick(['mode', 'value']))
);

export const nodes = (state = {}, action) => {
  let movedNode = null;
  let newNode = null;
  let newNodeId = 0;

  switch (action.type) {

    case NODE_ADD: {
      newNodeId = action.payload.newNodeId;
      newNode = R.set(R.lensProp('id'), newNodeId, {
        typeId: action.payload.typeId,
        position: action.payload.position,
        pins: getNodePins(action),
        properties: {},
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
        R.lensPath(getPropertyPath(action.payload)),
        parseVal(action.payload.value, action.payload.type)
      )(state);

    default:
      return state;
  }
};
