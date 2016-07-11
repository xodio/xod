import R from 'ramda';

export const getMeta = (state) => R.view(R.lensPath(['project', 'meta']))(state);
