import R from 'ramda';
import { NODE_ADD, LINK_ADD } from '../actionTypes';

export const counterReducer = (state = {}, action) => {
  switch (action.type) {
    case NODE_ADD: {
      const nodeType = action.payload.nodeType;
      const pinCount = R.pipe(
        R.values,
        R.length
      )(nodeType.pins);
      return R.merge(
        state,
        {
          nodes: R.inc(state.nodes),
          pins: R.add(state.pins, pinCount),
        }
      );
    }
    case LINK_ADD:
      return R.assoc('links', R.inc(state.links), state);
    default:
      return state;
  }
};
