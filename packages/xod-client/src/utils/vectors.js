import * as R from 'ramda';
import { vec } from 'vec-la-fp';

// Position :: { x: Number, y: Number }
// Vector :: [Number, Number]

// :: Position -> Vector
const positionToVector = ({ x, y }) => [x, y];

// :: Position -> Vector
const vectorToPosition = ([x, y]) => ({ x, y });

/**
 * Shorten or Prolongate vector length for the desired distance.
 */
 // :: Number -> Vector -> Vector
const changeVectorLength = R.curry(
  (amount, vector) => R.compose(
    sc => vec.scale(sc, vector),
    R.add(1),
    R.divide(amount),
    vec.mag
  )(vector)
);

// :: Number -> Position -> Position -> Position
// eslint-disable-next-line import/prefer-default-export
export const changeLineLength = R.curry(
  (amount, pos1, pos2) => {
    const v1 = positionToVector(pos1);
    const v2 = positionToVector(pos2);
    const d = vec.sub(v2, v1);
    return R.compose(
      vectorToPosition,
      vec.add(v1),
      changeVectorLength
    )(amount, d);
  }
);
