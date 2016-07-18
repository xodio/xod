import R from 'ramda';
import { NODE_DELETE, PIN_ADD, PIN_DELETE } from '../actionTypes';
import { getPinsByNodeId } from '../selectors/pin';

const getPinIds = (state) =>
  R.map(pin => parseInt(pin.id, 10))(R.values(state));

export const getLastId = (state) => {
  const ids = getPinIds(state);
  // -1 is important because if nodes store doesn't contain nodes then we should return 0 as newId
  return R.reduce(R.max, -1, ids);
};
export const getNewId = (state) => getLastId(state) + 1;

export const pins = (state = {}, action, projectState) => {
  let newId;

  switch (action.type) {
    case PIN_ADD:
      newId = getNewId(state);
      return R.set(
        R.lensProp(newId),
        {
          id: newId,
          nodeId: action.payload.nodeId,
          key: action.payload.key,
        },
        state
      );
    case NODE_DELETE: {
      const pinsToDelete = getPinsByNodeId(projectState, { id: action.payload.id });
      return R.omit(R.keys(pinsToDelete), state);
    }
    case PIN_DELETE:
      return R.omit([action.payload.id.toString()], state);
    default:
      return state;
  }
};
