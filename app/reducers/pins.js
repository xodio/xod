import R from 'ramda';
import { NODE_ADD, NODE_DELETE } from '../actionTypes';
import {
  getLastNodeId,
  getLastPinId,
  getPinsByNodeIdInPatch,
  getNodeTypes,
} from '../selectors/project';
import {
  isActionForCurrentPatch,
  currentPatchHasThatNode,
  getCurrentPatchId,
} from '../utils/reducerUtils';

const createPins = (state, nodeId, pins, projectState) => {
  let lastId = getLastPinId(projectState);

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
      return createPins(state, nodeId, nodeType.pins, projectState);
    }
    case NODE_DELETE: {
      if (!currentPatchHasThatNode(state, action.payload.id, projectState)) { return state; }

      const patchId = getCurrentPatchId(state, projectState);
      const pinsToDelete = getPinsByNodeIdInPatch(
        projectState,
        {
          id: action.payload.id,
          patchId,
        }
      );
      const pinIds = R.keys(pinsToDelete);
      return R.omit(pinIds, state);
    }
    default:
      return state;
  }
};
