import R from 'ramda';

export const getMeta = (state) => R.pipe(
  R.prop('meta')
)(state);
