import R from 'ramda';

export const deepMerge = R.mergeWith(
  (o1, o2) =>
  R.ifElse(
    R.is(Object),
    R.flip(R.mergeWith(deepMerge))(o2),
    R.flip(R.merge)(o2)
  )(o1)
);
