import * as R from 'ramda';

export const getErrors = R.prop('errors');

export const getLastId = R.pipe(R.keys, R.reduce(R.max, 0));

export const getNewId = R.pipe(getLastId, R.inc);
