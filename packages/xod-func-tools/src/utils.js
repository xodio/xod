import * as R from 'ramda';

/**
 * Function without any operation.
 * Frequently used as a default value for handlers and etc.
 */
export const noop = () => {};

export const notNil = R.complement(R.isNil);
export const notEmpty = R.complement(R.isEmpty);
export const hasNo = R.complement(R.has);
export const notEquals = R.complement(R.equals);

// enumerate(', ', ' or ', [1,2,3,4]) => "1, 2, 3 or 4"
export const enumerate = R.curry((separator, lastSeparator, items) => {
  const firstItems = R.dropLast(2, items);
  const lastItems = R.takeLast(2, items);

  return R.compose(
    R.join(separator),
    R.append(R.__, firstItems),
    R.join(lastSeparator)
  )(lastItems);
});

export const memoizeOnlyLast = f => {
  let lastArg;
  let result;

  return arg => {
    if (arg !== lastArg) {
      result = f(arg);
      lastArg = arg;
    }

    return result;
  };
};
