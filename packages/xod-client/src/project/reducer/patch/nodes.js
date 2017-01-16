import R from 'ramda';

import {
  NODE_MOVE,
  NODE_ADD,
  NODE_DELETE,
  NODE_UPDATE_PROPERTY,
  NODE_CHANGE_PIN_MODE,
} from '../../actionTypes';
import { PROPERTY_TYPE_PARSE } from 'xod-core';

export const copyNode = node => R.clone(node);

const parseVal = (val, type) => {
  if (type && R.has(type, PROPERTY_TYPE_PARSE)) {
    return PROPERTY_TYPE_PARSE[type](val);
  }

  return val;
};

const getNodePins = R.pipe(
  R.path(['nodeType', 'pins']),
  R.pickBy(R.propEq('injected', true)),
  R.mapObjIndexed(R.pick(['injected', 'value']))
);

const getPropertyPath = (payload, add) => {
  const kindPath = (payload.kind === 'pin') ? 'pins' : 'properties';
  const path = [
    payload.id,
    kindPath,
    payload.key,
  ];

  if (add && payload.kind === 'pin') {
    path.push(add);
  }

  return path;
};

const getDefaultPropertiesFromNodeType = R.compose(
  R.reduce(
    (acc, val) => R.assoc(R.prop('key', val), R.prop('value', val), acc),
    {}
  ),
  R.pathOr([], ['nodeType', 'properties'])
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
        pins: getNodePins(action.payload),
        position: action.payload.position,
        properties: getDefaultPropertiesFromNodeType(action.payload),
      });

      return R.set(R.lensProp(newNodeId), newNode, state);
    }
    case NODE_DELETE:
      return R.omit([action.payload.id.toString()], state);

    case NODE_MOVE:
      movedNode = R.set(R.lensProp('position'), action.payload.position, R.prop(action.payload.id, state));
      return R.set(R.lensProp(action.payload.id), movedNode, state);

    case NODE_UPDATE_PROPERTY:
      return R.set(
        R.lensPath(getPropertyPath(action.payload, 'value')),
        parseVal(action.payload.value, action.payload.type)
      )(state);

    case NODE_CHANGE_PIN_MODE: {
      const updateValue = (action.payload.value) ?
        R.assocPath([action.payload.id, 'pins', action.payload.key, 'value'], action.payload.value) :
        R.identity;

      return R.compose(
        R.assocPath(
          [action.payload.id, 'pins', action.payload.key, 'injected'],
          action.payload.injected
        ),
        updateValue
      )(state);
    }
    default:
      return state;
  }
};
