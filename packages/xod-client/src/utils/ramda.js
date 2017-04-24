import R from 'ramda';

export const notNil = R.complement(R.isNil);

export const noop = R.always(undefined);

export const isMany = R.compose(R.gt(R.__, 1), R.length);

export const isOne = R.compose(R.equals(1), R.length);

// :: [propName] -> Object -> Bool
export const propsAreFalsy = R.curry(R.compose(
  R.all(R.not),
  R.props
));
