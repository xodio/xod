import R from 'ramda';
import { Either, Maybe } from 'ramda-fantasy';
/**
 * Contains resulting value or error
 *
 * See: {@link https://github.com/ramda/ramda-fantasy/blob/master/docs/Either.md}
 *
 * @external Either
 */

/**
 * Contains resulting value or null
 *
 * See: {@link https://github.com/ramda/ramda-fantasy/blob/master/docs/Maybe.md}
 *
 * @external Maybe
 */

 /**
  * A special object for triggering nodes without passing data.
  *
  * @typedef {Object} Pulse
  */

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * Checks if a name is a valid name for entities like
 * project name, patch path component, etc
 *
 * @function validateName
 * @param {string} name - string to check
 * @returns {Either<Error|string>} error or valid name
 */
// TODO: implement

/**
 * Checks that passed argument is array of strings
 *
 * @function isArrayOfStrings
 * @param {Array} array
 * @returns {boolean}
 */
export const isArrayOfStrings = R.both(
  R.is(Array),
  R.all(R.is(String))
);

/**
 * Checks that passed argument is array of numbers
 *
 * @function isArrayOfNumbers
 * @param {Array} array
 * @returns {boolean}
 */
export const isArrayOfNumbers = R.both(
  R.is(Array),
  R.all(R.is(Number))
);

/**
 * Associate value into some property and wrap it with Either.Right
 * @function assocRight
 * @param {string} propName
 * @param {*} value
 * @param {Project} project
 * @returns {Either.Right<Project>}
 */
export const assocRight = R.curry(
  R.compose(
    Either.Right,
    R.assoc
  )
);

/**
 * Returns an Error object wrapped into Either.Left
 * @function leaveError
 * @param {string} errorMessage
 * @returns {Either.Left<Error>}
 */
export const leaveError = R.compose(
  R.always,
  Either.Left,
  R.construct(Error)
);
