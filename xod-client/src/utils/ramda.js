import R from 'ramda';

export const notNil = R.complement(R.isNil);

export const noop = R.always(undefined);
