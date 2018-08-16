import * as R from 'ramda';
import { notNil } from 'xod-func-tools';

import initialState from './state';
import UPDATE_HINTING from './actionType';
import { mergeErrors } from './validation';

const errorsLens = R.lensProp('errors');
// =============================================================================
const getDeducedTypesFromAction = R.path(['payload', 'deducedTypes']);
const getErrorsFromAction = R.path(['payload', 'errors']);
const getPatchSearchDataFromAction = R.path(['payload', 'patchSearchData']);
// =============================================================================
const updateDeducedTypes = R.curry((action, state) =>
  R.ifElse(
    R.pipe(getDeducedTypesFromAction, notNil),
    R.pipe(getDeducedTypesFromAction, R.assoc('deducedTypes', R.__, state)),
    R.always(state)
  )(action)
);
const updateErrors = R.curry((action, state) =>
  R.ifElse(
    R.pipe(getErrorsFromAction, notNil),
    R.pipe(getErrorsFromAction, errs =>
      R.over(errorsLens, mergeErrors(R.__, errs), state)
    ),
    R.always(state)
  )(action)
);
const updatePatchSearchData = R.curry((action, state) =>
  R.ifElse(
    R.pipe(getPatchSearchDataFromAction, notNil),
    R.pipe(
      getPatchSearchDataFromAction,
      R.assoc('patchSearchData', R.__, state)
    ),
    R.always(state)
  )(action)
);
// =============================================================================

export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_HINTING:
      return R.compose(
        updateDeducedTypes(action),
        updateErrors(action),
        updatePatchSearchData(action)
      )(state);
    default:
      return state;
  }
};
