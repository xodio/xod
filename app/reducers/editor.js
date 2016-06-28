import R from 'ramda';
import { PIN_SELECT } from '../actionTypes';

export const editor = (state = {}, action) => {
  switch (action.type) {
    case PIN_SELECT:
      return R.set(R.lensProp('selectedPin'), action.payload.id, state);
    default:
      return state;
  }
};
