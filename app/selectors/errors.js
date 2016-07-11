import R from 'ramda';

export const getErrors = (state) => R.pipe(
  R.prop('errors')
)(state);
