import * as R from 'ramda';
import { notNil } from 'xod-func-tools';

import initialState from './state';
import UPDATE_HINTING from './actionType';
import { mergeErrors } from './validation';

const errorsLens = R.lensProp('errors');

const getDeducedTypesFromAction = R.path(['payload', 'deducedTypes']);
const getErrorsFromAction = R.path(['payload', 'errors']);
const getPatchSearchDataFromAction = R.path(['payload', 'patchSearchData']);

export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_HINTING:
      return R.compose(
        R.when(
          R.pipe(getDeducedTypesFromAction, notNil),
          R.pipe(
            getDeducedTypesFromAction,
            R.assoc('deducedTypes', R.__, state)
          )
        ),
        R.when(
          R.pipe(getErrorsFromAction, notNil),
          R.pipe(getErrorsFromAction, errs =>
            R.over(errorsLens, mergeErrors(R.__, errs), state)
          )
        ),
        R.when(
          R.pipe(getPatchSearchDataFromAction, notNil),
          R.pipe(
            getPatchSearchDataFromAction,
            R.assoc('patchSearchData', R.__, state)
          )
        )
      )(action);
    default:
      return state;
  }
};
