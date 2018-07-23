import * as R from 'ramda';

export const getHintingState = R.prop('hinting');

export const getDeducedTypes = R.compose(
  R.prop('deducedTypes'),
  getHintingState
);

export const getErrors = R.compose(R.prop('errors'), getHintingState);
