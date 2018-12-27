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
const getPatchMarkersFromAction = R.path(['payload', 'patchMarkers']);
// =============================================================================
const updateDeducedTypes = R.curry((action, state) =>
  R.ifElse(
    R.pipe(getDeducedTypesFromAction, notNil),
    R.pipe(getDeducedTypesFromAction, R.assoc('deducedTypes', R.__, state)),
    R.always(state)
  )(action)
);
const updateErrors = R.curry((action, state) =>
  R.compose(
    R.ifElse(
      notNil,
      errs => R.over(errorsLens, mergeErrors(R.__, errs), state),
      R.always(state)
    ),
    getErrorsFromAction
  )(action)
);
const updatePatchSearchData = R.curry((action, state) =>
  R.compose(
    R.ifElse(notNil, R.assoc('patchSearchData', R.__, state), R.always(state)),
    getPatchSearchDataFromAction
  )(action)
);
const updatePatchMarkers = R.curry((action, state) =>
  R.compose(
    R.ifElse(notNil, R.assoc('patchMarkers', R.__, state), R.always(state)),
    getPatchMarkersFromAction
  )(action)
);
// =============================================================================

export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_HINTING:
      return R.compose(
        updateDeducedTypes(action),
        updateErrors(action),
        updatePatchSearchData(action),
        updatePatchMarkers(action)
      )(state);
    default:
      return state;
  }
};
