import R from 'ramda';

/**
 * Function without any operation.
 * Frequently used as a default value for handlers and etc.
 */
export const noop = () => {};

export const notNil = R.complement(R.isNil);
export const notEmpty = R.complement(R.isEmpty);
export const hasNo = R.complement(R.has);
export const notEquals = R.complement(R.equals);
