import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

//
// Functions that wraps results into Maybe monad
//
// TODO: Disquss: Should we make docs for this functions or keep it private?

// :: RegExp -> string -> Maybe<Nothing|string>
export const match = R.curry(R.compose(
  Maybe,
  R.compose(
    R.ifElse(
      R.isEmpty,
      R.always(null),
      R.identity
    ),
    R.prop(1)
  ),
  R.match
));

// :: *|Maybe -> Maybe<Nothing|*>
export const ensureMaybe = R.ifElse(
  R.is(Maybe),
  R.identity,
  Maybe
);

// :: string -> object -> Maybe<Nothing|*>
export const prop = R.curry(R.compose(
  Maybe,
  R.prop
));

// :: array -> object -> Maybe<Nothing|*>
export const path = R.curry(R.compose(
  Maybe,
  R.path
));

// :: function -> object -> Maybe<Nothing|*>
export const find = R.curry(R.compose(
  Maybe,
  R.find
));

//
// Functions with Either monad
// Migrated from Utils
//

/**
 * Returns an Error object wrapped into Either.Left
 * @function err
 * @param {string} errorMessage
 * @returns {Either.Left<Error>}
 */
export const err = R.compose(
  R.always,
  Either.Left,
  R.construct(Error)
);

/**
 * Returns function that checks condition and returns Either
 * Left with Error for false
 * Right with passed content for true
 * @function errOnFalse
 * @param {string} errorMessage
 * @param {function} condition
 * @returns {function}
 */
export const errOnFalse = R.curry(
  (errorMessage, condition) => R.ifElse(
    condition,
    Either.of,
    err(errorMessage)
  )
);

/**
 * Return Either.Right for Maybe.Just and Either.Left for Maybe.Nothing
 * @function errOnNothing
 * @param {string} errorMessage Error message for Maybe.Nothing
 * @param {*|Maybe<*>} data Data or Maybe monad
 * @returns {Either<Error|*>}
 */
export const errOnNothing = R.curry(
  (errorMessage, data) => R.compose(
    R.ifElse(
      Maybe.isNothing,
      err(errorMessage),
      R.chain(Either.Right)
    ),
    ensureMaybe
  )(data)
);

//
// General Ramda-utils
//

/**
 * Checks that value is exist in the dictionary (object).
 * @function hasPropEq
 * @param {*} value
 * @param {object} dictionary
 * @returns {boolean}
 */
export const hasPropEq = R.useWith(
  R.contains, [R.identity, R.values]
);

/**
 * Returns function that assoc string to a specified key
 * @function assocString
 * @param {string} key
 * @returns {function}
 */
export const assocString = (key) => R.useWith(
  R.assoc(key),
  [
    String,
    R.identity,
  ]
);

/**
 * Returns function that assoc number to a specified key
 * @function assocString
 * @param {string} key
 * @returns {function}
 */
export const assocNumber = (key) => R.useWith(
  R.assoc(key),
  [
    R.compose(
      R.defaultTo(0),
      Number
    ),
    R.identity,
  ]
);
