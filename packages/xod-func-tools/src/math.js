import { def } from './types';

/**
 * Rounds a number to a desired number of digits after the dot.
 * (2, 1.1115) -> 1.11
 * (3, 1.1115) -> 1.112
 * (4, 1.1115) -> 1.1115
 * (5, 1) -> 1
 */
// eslint-disable-next-line import/prefer-default-export
export const roundTo = def(
  'roundTo :: Number -> Number -> Number',
  (n, number) => {
    const mult = Math.pow(10, n);
    return Math.round(number * mult) / mult;
  }
);
