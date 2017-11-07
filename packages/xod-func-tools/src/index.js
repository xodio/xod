import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import * as types from './types';

export * from './types';

const def = types.def;

/**
 * Function without any operation.
 * Frequently used as a default value for handlers and etc.
 */
export const noop = () => {};

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
  [
    Maybe.isNothing,
    () => {
      throw new Error('Maybe is expected to be Just, but its Nothing.');
    },
  ],
  [Either.isRight, R.unnest],
  [
    Either.isLeft,
    val => {
      throw new Error(
        `Either expected to be Right, but its Left with value: ${val}`
      );
    },
  ],
  [
    R.T,
    input => {
      throw new Error(
        `Maybe or Either should be passed into explode function. Passed: ${
          input
        }`
      );
    },
  ],
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

export const catMaybes = def(
  'catMaybes :: [Maybe a] -> [a]',
  R.compose(
    R.map(explodeMaybe('Expected Just, but got Nothing.')),
    R.filter(Maybe.isJust)
  )
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
  (leftFn, rightFn, eitherObject) =>
    eitherObject.isLeft
      ? leftFn(eitherObject.value)
      : rightFn(eitherObject.value)
);

// :: Either a b -> Promise a b
export const eitherToPromise = foldEither(
  Promise.reject.bind(Promise),
  Promise.resolve.bind(Promise)
);

export const sanctuaryDefEitherToRamdaFantasyEither = sdEither =>
  sdEither.isLeft ? Either.Left(sdEither.value) : Either.Right(sdEither.value);

export const validateSanctuaryType = R.uncurryN(2, SanctuaryType =>
  R.compose(
    sanctuaryDefEitherToRamdaFantasyEither,
    SanctuaryType.validate.bind(SanctuaryType)
  )
);

/**
 * Unwraps Either monad and returns it’s value if it is Right and throws an Error
 * if it is Left.
 */
export const explodeEither = def(
  'explodeEither :: Either a b -> b',
  foldEither(err => {
    throw new Error(`Explosion failed: ${err}`);
  }, R.identity)
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
  (m, fn, initial, list) =>
    R.reduce((acc, a) => R.chain(val => fn(val, a), acc), m(initial), list)
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

/*
 * Like Ramda’s `omit` but works recursively, and never changes the type of
 * an input.
 */
export const omitRecursively = def(
  'omitRecursively :: [String] -> a -> a',
  (keys, obj) => {
    const isPlainObject = R.both(R.is(Object), R.complement(R.is(Array)));

    return R.compose(
      R.map(R.when(R.is(Object), omitRecursively(keys))),
      R.when(isPlainObject, R.omit(keys))
    )(obj);
  }
);

// :: Object -> Object
export const omitTypeHints = omitRecursively(['@@type']);

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
  R.uncurryN(2, objToSubstract =>
    R.converge(R.omit, [
      R.compose(
        R.keys,
        R.pickBy(
          R.both(
            (value, key) => R.has(key, objToSubstract),
            (value, key) => R.propEq(key, value, objToSubstract)
          )
        )
      ),
      R.identity,
    ])
  )
);

/**
 * Like `R.tap` but works with Promises.
 * @param {Function} promiseFn Function that returns Promise
 * @returns {Function} Run promiseFn with argument and returns the same argument on resolve
 */
export const tapP = promiseFn => arg => promiseFn(arg).then(R.always(arg));

// :: ERROR_CODE -> Error -> Promise.Reject Error
export const rejectWithCode = R.curry((code, err) =>
  Promise.reject(Object.assign(err, { errorCode: code }))
);

// :: [Promise a] -> Promise a
export const allPromises = promises => Promise.all(promises);

// :: Number -> Promise.Resolved ()
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Concatenates a list of lists into one list.
 */
// :: [[a]] -> [a]
export const concatAll = R.reduce(R.concat, []);

/**
 * Creates a new object with the own properties of the provided object, but the
 * keys renamed according to the keysMap object as `{oldKey: newKey}`.
 * When some key is not found in the keysMap, then it's passed as-is.
 *
 * Keep in mind that in the case of keys conflict is behaviour undefined and
 * the result may vary between various JS engines!
 *
 * @sig {a: b} -> {a: *} -> {b: *}
 *
 * Taken from Ramda Cookbook
 */
export const renameKeys = R.curry((keysMap, obj) =>
  R.reduce(
    (acc, key) => R.assoc(keysMap[key] || key, obj[key], acc),
    {},
    R.keys(obj)
  )
);

/**
 * Maps an array using a mapping function that on each iteration step receives
 * an array element, its index, and the whole array itself
 */
// :: ((a, Number, [a]) -> b) -> [a] -> [b]
export const mapIndexed = R.addIndex(R.map);

/**
 * Swaps two elements of `array` having `oldIndex` and `newIndex` indexes.
 */
// :: Number -> Number -> [a] -> [a]
export const swap = R.curry((oldIndex, newIndex, array) => {
  const oldItem = R.nth(oldIndex, array);
  const newItem = R.nth(newIndex, array);

  return R.pipe(R.update(oldIndex, newItem), R.update(newIndex, oldItem))(
    array
  );
});

/**
 * Finds a key that contains specified value.
 * If object contains few properties with this value
 * it will return only one, first matched.
 */
export const reverseLookup = def(
  'reverseLookup :: a -> Map b a -> b',
  (val, obj) =>
    R.compose(R.nth(0), R.find(R.compose(R.equals(val), R.nth(1))), R.toPairs)(
      obj
    )
);

/**
 * Switch keys with values.
 * E.G. { a: 'abc' } will become { abc: 'a' }
 */
export const invertMap = def(
  'invertMap :: Map a b -> Map b a',
  R.compose(R.fromPairs, R.map(R.reverse), R.toPairs)
);

/**
 * Returns the list of list of strings.
 * Removes all duplicates from the subsequent list
 * on the basis of already filtered values lists.
 *
 * E.G.
 * [['a', 'b', 'c'], ['b','c','d'], ['a','d','e']]
 * will become
 * [['a', 'b', 'c'], ['d'], ['e']]
 */
export const uniqLists = def(
  'uniqLists :: [[String]] -> [[String]]',
  R.reduce(
    (acc, nextList) => R.append(R.without(R.unnest(acc), nextList), acc),
    []
  )
);

export default Object.assign(
  {
    explode,
    explodeMaybe,
    catMaybes,
    foldEither,
    eitherToPromise,
    sanctuaryDefEitherToRamdaFantasyEither,
    validateSanctuaryType,
    hasNo,
    omitNilValues,
    omitEmptyValues,
    omitRecursively,
    omitTypeHints,
    isAmong,
    optionalObjOf,
    notNil,
    notEmpty,
    rejectWithCode,
    allPromises,
    concatAll,
    renameKeys,
    mapIndexed,
    swap,
    reverseLookup,
    uniqLists,
  },
  types
);
