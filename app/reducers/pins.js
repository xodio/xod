import R from 'ramda';
import { NODE_ADD, NODE_DELETE } from '../actionTypes';
import { forThisPatch, isPinsInThisPatch } from '../utils/actions';

const createPins = (state, nodeId, pins, lastPinId) => {
  let lastId = R.clone(lastPinId);

  return R.pipe(
    R.values,
    R.reduce((p, pin) => {
      lastId++;

      return R.assoc(
        lastId,
        {
          id: lastId,
          nodeId,
          key: pin.key,
        },
        p
      );
    }, state)
  )(pins);
};

export const pins = (state = {}, action, patchId) => {
  switch (action.type) {
    case NODE_ADD: {
      if (!forThisPatch(action, patchId)) { return state; }

      const nodeType = action.payload.nodeType;
      const nodeId = action.payload.newNodeId;
      const lastPinId = action.payload.lastPinId;

      return createPins(state, nodeId, nodeType.pins, lastPinId);
    }
    case NODE_DELETE: {
      if (!isPinsInThisPatch(state, action.payload.pins)) { return state; }
      return R.omit(action.payload.pins, state);
    }
    default:
      return state;
  }
};
