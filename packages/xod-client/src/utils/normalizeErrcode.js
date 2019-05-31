import * as R from 'ramda';

// :: DataValue -> DataValue
export default R.pipe(
  R.when(R.test(/^[eE].*/g), R.tail),
  x => parseInt(x, 10),
  R.defaultTo(0),
  R.min(127),
  R.max(0),
  n => `E${n}`
);
