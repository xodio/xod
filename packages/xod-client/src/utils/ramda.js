import R from 'ramda';

export const notNil = R.complement(R.isNil);

export const noop = R.always(undefined);

// :: [fieldName] -> Object -> Bool
export const allFieldsAreFalsy = R.pipe(
  R.map(R.prop),
  R.map(R.complement),
  R.allPass
);
