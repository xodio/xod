import * as R from 'ramda';

import initialState from './state';
import UPDATE_HINTING from './actionType';
import { mergeErrors } from './validation';

const errorsLens = R.lensProp('errors');

export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_HINTING:
      return R.compose(
        R.when(
          () => action.payload.deducedTypes,
          R.assoc('deducedTypes', action.payload.deducedTypes)
        ),
        R.when(
          () => action.payload.errors,
          R.over(errorsLens, mergeErrors(R.__, action.payload.errors))
        )
      )(state);
    default:
      return state;
  }
};
