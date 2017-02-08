import R from 'ramda';

export const notNil = R.complement(R.isNil);

export const noop = R.always(undefined);

// :: [propName] -> Object -> Bool
export const propsAreFalsy = R.curry(R.compose(
  R.all(R.not),
  R.props
));
