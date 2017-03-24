import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import * as types from './types';

export * from './types';

const def = types.def;

/**
 * Function to rapidly extract a value from Maybe or Either monad.
 * But it should be used only when we're sure that we should have a value,
 * otherwise it will throw an exception.
 *
 * @private
 * @function explode
 * @param {Maybe|Either}
 * @returns {*}
 * @throws Error
 */
export const explode = R.cond([
  [Maybe.isJust, R.unnest],
  [Maybe.isNothing, () => { throw new Error('Maybe is expected to be Just, but its Nothing.'); }],
  [Either.isRight, R.unnest],
  [Either.isLeft, (val) => { throw new Error(`Either expected to be Right, but its Left with value: ${val}`); }],
  [R.T, (input) => { throw new Error(`Maybe or Either should be passed into explode function. Passed: ${input}`); }],
]);

/**
 * Function to rapidly extract a value from Maybe.Just
 * or throw a defined error message on Maybe.Nothing
 *
 * @private
 * @function explodeMaybe
 * @param {String} errorMessage
 * @param {Maybe} maybeObject
 * @returns {*}
 * @throws Error
 */
export const explodeMaybe = def(
  'explodeMaybe :: String -> Maybe a -> a',
  (errorMessage, maybeObject) => {
    if (maybeObject.isJust) return maybeObject.value;
    throw new Error(errorMessage);
  }
);

/**
 * Function to extract value from `Either` by providing a function
 * to handle the types of values contained in both `Left` and `Right`.
 *
 * This is hack to prevent errors on using `Either.either` with
 * cross-package Eithers (`Either.either` checks for instanceof and
 * it has other constuctors for some reason).
 *
 * @private
 * @function foldEither
 * @param {Function} leftFn
 * @param {Function} rightFn
 * @param {Either} eitherObject
 * @returns {*}
 * @throws Error
 */
export const foldEither = def(
  'foldEither :: (a -> c) -> (b -> c) -> Either a b -> c',
  (leftFn, rightFn, eitherObject) => (
    eitherObject.isLeft ? leftFn(eitherObject.value) : rightFn(eitherObject.value)
  )
);

export default Object.assign(
  {
    explode,
    explodeMaybe,
    foldEither,
  },
  types
);
