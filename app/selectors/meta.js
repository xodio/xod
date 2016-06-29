import R from 'ramda';

export const getMeta = (state) => R.pipe(
  R.view(R.lensProp('meta'))
)(state);
