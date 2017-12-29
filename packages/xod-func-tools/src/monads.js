import * as R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import { def } from './types';

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

/**
 * Function to extract value from `Maybe` by providing
 * a default value for `Nothing` and function to handle `Just`.
 *
 * This is hack to prevent errors on using `Maybe.maybe` with
 * cross-package Maybies (`Maybe.maybe` checks for instanceof and
 * it has other constuctors for some reason).
 *
 * @private
 * @function foldMaybe
 * @param {*} nothingVal
 * @param {Function} justFn
 * @param {Maybe} maybeObject
 * @returns {*}
 * @throws Error
 */
export const foldMaybe = def(
  'foldMaybe :: b -> (a -> b) -> Maybe a -> b',
  (nothingVal, justFn, maybeObject) => (
    maybeObject.isJust ? justFn(maybeObject.value) : nothingVal
  )
);

/**
 * DEPRECATED: Use of this function lead to meaningless error messages that
 * are nearly impossible to debug. Use `explodeMaybe` and `explodeEither`
 * to convert monads to unhandled exceptions.
 *
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

export const catMaybies = def(
  'catMaybies :: [Maybe a] -> [a]',
  R.compose(
    R.map(explodeMaybe('Expected Just, but got Nothing.')),
    R.filter(Maybe.isJust)
  )
);

/**
 * Unwraps Either monad and returns it’s value if it is Right and throws an Error
 * if it is Left.
 */
export const explodeEither = def(
  'explodeEither :: Either a b -> b',
  foldEither(
    (err) => { throw new Error(`Explosion failed: ${err}`); },
    R.identity
  )
);

// :: Either a b -> Promise a b
export const eitherToPromise = foldEither(
  Promise.reject.bind(Promise),
  Promise.resolve.bind(Promise)
);

// :: (() -> b) -> (a -> a) -> Maybe a -> Promise a b
export const maybeToPromise = R.curry(
  (nothingFn, justFn, maybe) => new Promise(
    (resolve, reject) => (
      maybe.isJust ? resolve(maybe.value) : reject()
    )
  ).then(justFn, nothingFn)
);

/**
 * Returns a result of calling iterator function over argument list.
 * Use this function if iterator function returns some Monad.
 * Monad constructor should be passed as first argument, cause
 * we haven't got type deduction in JS. :-(
 * E.G.
 * assocLink :: Link -> Patch -> Either Error Patch
 * upsertLinks = reduceEither(assocLink, patch, [link0, link1, link2]);
 */
export const reduceM = def(
  'reduceM :: (b -> m b) -> (b -> a -> m b) -> b -> [a] -> m c',
  (m, fn, initial, list) => R.reduce(
    (acc, a) => R.chain(val => fn(val, a), acc),
    m(initial),
    list
  )
);

/**
 * Returns a result of calling iterator function over argument list.
 * Use this function if iterator function returns Either.
 * @see reduceM for more details
 */
export const reduceEither = def(
  'reduceEither :: (b -> a -> Either c b) -> b -> [a] -> Either c b',
  reduceM(Either.of)
);

/**
 * Returns a result of calling iterator function over argument list.
 * Use this function if iterator function returns Either.
 * @see reduceM for more details
 */
export const reduceMaybe = def(
  'reduceEither :: (b -> a -> Maybe b) -> b -> [a] -> Maybe b',
  reduceM(Maybe.of)
);
