import R from 'ramda';
import * as ActionType from '../actionTypes';

export const meta = (state = {}, action) => {
  switch (action.type) {
    case ActionType.META_UPDATE: {
      return R.merge(state, action.payload);
    }
    default:
      return state;
  }
};
