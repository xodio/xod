import R from 'ramda';
import * as ActionType from '../actionTypes';

export default (state = {}, action) => {
  switch (action.type) {
    case ActionType.PROJECT_RENAME:
      return R.assoc('name', action.payload, state);
    case ActionType.META_UPDATE: {
      return R.merge(state, action.payload);
    }
    default:
      return state;
  }
};
