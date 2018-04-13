import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';

//
// Functions that wraps results into Maybe monad
//
// TODO: Disquss: Should we make docs for this functions or keep it private?

// :: RegExp -> groupIndex -> string -> Maybe<string>
export const match = R.curry((regExp, groupIndex, string) =>
  R.compose(
    Maybe,
    R.compose(
      R.ifElse(R.isEmpty, R.always(null), R.identity),
      R.prop(groupIndex)
    ),
    R.match(regExp)
  )(string)
);

// :: *|Maybe -> Maybe<*>
export const ensureMaybe = R.ifElse(R.is(Maybe), R.identity, Maybe);

// :: string -> object -> Maybe<*>
export const prop = R.curry(R.compose(Maybe, R.prop));

// :: array -> object -> Maybe<*>
export const path = R.curry(R.compose(Maybe, R.path));

// :: function -> object -> Maybe<*>
export const find = R.curry(R.compose(Maybe, R.find));

//
// General Ramda-utils
//

/**
 * Checks that value exists in the dictionary (object).
 * @private
 * @function hasPropEq
 * @param {*} value
 * @param {object} dictionary
 * @returns {boolean}
 */
export const hasPropEq = R.useWith(R.contains, [R.identity, R.values]);

/**
 * Returns function that assoc string to a specified key
 * @function assocString
 * @param {string} key
 * @returns {function}
 */
export const assocString = key => R.useWith(R.assoc(key), [String, R.identity]);

/**
 * Returns function that assoc number to a specified key
 * @function assocString
 * @param {string} key
 * @returns {function}
 */
export const assocNumber = key =>
  R.useWith(R.assoc(key), [R.compose(R.defaultTo(0), Number), R.identity]);
