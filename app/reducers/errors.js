import R from 'ramda';
import * as ActionType from '../actionTypes';

export const errors = (state = [], action) => {
  switch (action.type) {
    case ActionType.ERROR_SHOW:
      return R.append(action.payload, state);
    case ActionType.ERROR_HIDE: {
      const filter = (n) => n.id === action.payload.id;
      return R.reject(filter, state);
    }
    default:
      return state;
  }
};
