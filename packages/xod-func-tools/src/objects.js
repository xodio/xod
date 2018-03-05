import * as R from 'ramda';
import { def } from './types';

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
  (keys, input) => {
    const isPlainObject = R.both(R.is(Object), R.complement(R.is(Array)));

    return R.compose(
      R.map(R.when(R.is(Object), omitRecursively(keys))),
      R.when(isPlainObject, R.omit(keys))
    )(input);
  }
);

// :: Object -> Object
export const omitTypeHints = def(
  'omitTypeHints :: Object -> Object',
  omitRecursively(['@@type'])
);

/**
 * Like `R.objOf` but returns empty object {} if value is `null` or `undefined`
 */
export const optionalObjOf = def(
  'optionalObjOf :: String -> a -> StrMap a',
  (key, val) => (val == null ? {} : { [key]: val })
);

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
export const renameKeys = def(
  'renameKeys :: Map a b -> Map a c -> Map b c',
  (keysMap, obj) =>
    R.reduce(
      (acc, key) => R.assoc(keysMap[key] || key, obj[key], acc),
      {},
      R.keys(obj)
    )
);

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
