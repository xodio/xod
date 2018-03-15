import * as R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

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
// Functions with Either monad
//

/**
 * Returns an Error object wrapped into Either.Left
 * @private
 * @function err
 * @param {string|object} errorMessage
 * @returns {Either.Left<Error>}
 */
export const err = R.compose(
  R.always,
  Either.Left,
  R.ifElse(R.is(String), R.construct(Error), ({ title, message }) => {
    const e = new Error(message);
    e.title = title;
    return e;
  })
);

/**
 * Returns function that checks condition and returns Either
 * Left with Error for false
 * Right with passed content for true
 * @private
 * @function errOnFalse
 * @param {string|object} errorMessage
 * @param {function} condition
 * @returns {function}
 */
export const errOnFalse = R.curry((errorMessage, condition) =>
  R.ifElse(condition, Either.of, err(errorMessage))
);

/**
 * Return Either.Right for Maybe.Just and Either.Left for Maybe.Nothing
 * @private
 * @function errOnNothing
 * @param {string|object} errorMessage Error message for Maybe.Nothing
 * @param {*|Maybe<*>} data Data or Maybe monad
 * @returns {Either<Error|*>}
 */
export const errOnNothing = R.curry((errorMessage, data) =>
  R.compose(
    R.ifElse(Maybe.isNothing, err(errorMessage), R.chain(Either.Right)),
    ensureMaybe
  )(data)
);

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
