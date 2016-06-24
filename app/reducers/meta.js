import R from 'ramda';
import * as ActionType from '../actionTypes';
import initialState from '../state';

export const meta = (state, action) => {
  const newState = (state === undefined) ? R.clone(initialState.project.meta) : state;
  switch (action.type) {
    case ActionType.META_UPDATE: {
      return R.merge(newState, action.payload);
    }
    default:
      return newState;
  }
};
