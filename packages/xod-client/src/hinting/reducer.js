import * as R from 'ramda';

import initialState from './state';
import * as AT from './actionTypes';

export default (state = initialState, action) => {
  switch (action.type) {
    case AT.UPDATE_DEDUCED_TYPES:
      return R.assoc('deducedTypes', action.payload, state);
    case AT.UPDATE_ERRORS:
      return R.assoc('errors', action.payload, state);
    case AT.UPDATE_HINTING:
      return R.compose(
        R.assoc('deducedTypes', action.payload.deducedTypes),
        R.assoc('errors', action.payload.errors)
      )(state);
    default:
      return state;
  }
};
