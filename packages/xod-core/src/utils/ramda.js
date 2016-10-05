import R from 'ramda';

// eslint-disable-next-line import/prefer-default-export
export const deepMerge = R.mergeWith(
  (o1, o2) =>
  R.ifElse(
    R.is(Object),
    R.flip(R.mergeWith(deepMerge))(o2),
    R.flip(R.merge)(o2)
  )(o1)
);

export const notNil = R.complement(R.isNil);
export const hasNot = R.complement(R.has);
