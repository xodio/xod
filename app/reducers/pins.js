import R from 'ramda';
import { NODE_ADD, NODE_DELETE } from '../actionTypes';
import { getLastNodeId, getPinsByNodeId, getNodeTypes } from '../selectors/project';
import {
  isActionForCurrentPatch,
} from '../utils/reducerUtils';

const getPinIds = (state) =>
  R.map(pin => parseInt(pin.id, 10))(R.values(state));

export const getLastId = (state) => {
  const ids = getPinIds(state);
  // -1 is important because if nodes store doesn't contain nodes then we should return 0 as newId
  return R.reduce(R.max, 0, ids);
};

const createPins = (state, nodeId, pins) => {
  let lastId = getLastId(state);

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

export const pins = (state = {}, action, projectState) => {
  switch (action.type) {
    case NODE_ADD: {
      if (!isActionForCurrentPatch(state, action, projectState)) { return state; }

      const nodeType = getNodeTypes(projectState)[action.payload.typeId];
      const nodeId = getLastNodeId(projectState) + 1;
      return createPins(state, nodeId, nodeType.pins);
    }
    case NODE_DELETE: {
      const pinsToDelete = getPinsByNodeId(projectState, { id: action.payload.id });
      return R.omit(R.keys(pinsToDelete), state);
    }
    default:
      return state;
  }
};
