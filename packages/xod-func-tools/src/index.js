import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import * as types from './types';

export * from './types';

const def = types.def;

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
 * Unwraps Either monad and returns it’s value if it is Right and throws an Error
 * if it is Left.
 */
export const explodeEither = def(
  'explodeMaybe :: Either a b -> b',
  foldEither(
    (err) => { throw new Error(`Explosion failed: ${err}`); },
    R.identity
  )
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
  'reduceM :: (b -> m b) -> (b -> a -> m b) -> b -> [a] -> m b',
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

/**
 * Returns an object provided with all `null` and `undefined` values omitted
 */
export const omitNilValues = def(
  'omitNilValues :: Object -> Object',
  R.reject(R.isNil)
);

/**
 * Returns an object provided with all empty (in sense of R.isEmpty) values
 * omitted
 */
export const omitEmptyValues = def(
  'omitEmptyValues :: Object -> Object',
  R.reject(R.isEmpty)
);

/**
 * Checks if an element is among elements of a list
 */
export const isAmong = def(
  'isAmong :: [a] -> a -> Boolean',
  R.flip(R.contains)
);

/**
 * Like `R.objOf` but returns empty object {} if value is `null` or `undefined`
 */
export const optionalObjOf = def(
  // 'optionalObjOf :: String -> a -> StrMap a', // TODO fix hm-def
  'optionalObjOf :: String -> a -> Object',
  (key, val) => (val == null ? {} : { [key]: val })
);

export const notNil = R.complement(R.isNil);
export const notEmpty = R.complement(R.isEmpty);
export const hasNo = R.complement(R.has);

// Returns a copy of second object with omitted
// fields that are equal to fields from first object.
// Kind of the reverse of R.merge.
//
//   subtractObject(
//     { foo: 1, bar: 2 },
//     { foo: 1, bar: 'not 2', baz: 3 }
//   ) // => { bar: "not 2", baz: 3}
export const subtractObject = def(
  'subtractObject :: Object -> Object -> Object',
  R.uncurryN(2, objToSubstract => R.converge(
    R.omit,
    [
      R.compose(
        R.keys,
        R.pickBy(R.both(
          (value, key) => R.has(key, objToSubstract),
          (value, key) => R.propEq(key, value, objToSubstract)
        ))
      ),
      R.identity,
    ]
  ))
);

/**
 * Like `R.tap` but works with Promises.
 * @param {Function} promiseFn Function that returns Promise
 * @returns {Function} Run promiseFn with argument and returns the same argument on resolve
 */
export const tapP = promiseFn => arg => promiseFn(arg).then(R.always(arg));

// :: ERROR_CODE -> Error -> Promise.Reject Error
export const rejectWithCode = R.curry(
  (code, err) => Promise.reject(Object.assign(err, { errorCode: code }))
);

// :: [Promise a] -> Promise a
export const allPromises = promises => Promise.all(promises);

/**
 * Concatenates a list of lists into one list.
 */
// :: [[a]] -> [a]
export const concatAll = R.reduce(R.concat, []);

export default Object.assign(
  {
    explode,
    explodeMaybe,
    foldEither,
    hasNo,
    omitNilValues,
    omitEmptyValues,
    isAmong,
    optionalObjOf,
    notNil,
    notEmpty,
    rejectWithCode,
    allPromises,
    concatAll,
  },
  types
);
