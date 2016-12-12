import R from 'ramda';
import { Either } from 'ramda-fantasy';

import * as Utils from './utils';
import * as CONST from './constants';

/**
 * An object representing patch pin
 * @typedef {Object} Pin
 */

 /**
  * A {@link Pin} object or just its key as {@link string}
  * @typedef {(Pin|string)} PinOrKey
  */

 // =============================================================================
 //
 // Pin
 //
 // =============================================================================

/**
 * @function getPinType
 * @param {Pin} pin
 * @returns {PIN_TYPE}
 */
export const getPinType = R.prop('type');

/**
 * @function getPinDirection
 * @param {Pin} pin
 * @returns {PIN_DIRECTION}
 */
export const getPinDirection = R.prop('direction');

/**
 * @function getPinKey
 * @param {Pin} pin
 * @returns {string}
 */
export const getPinKey = R.ifElse(R.is(String), R.identity, R.prop('key'));

/**
 * @function getPinLabel
 * @param {Pin} pin
 * @returns {string}
 */
export const getPinLabel = R.propOr('', 'label');

/**
 * @function setPinLabel
 * @param {string} label
 * @param {Pin} pin
 * @returns {Pin}
 */
export const setPinLabel = Utils.assocString('label');

/**
 * @function getPinDescription
 * @param {Pin} pin
 * @returns {string}
 */
export const getPinDescription = R.propOr('', 'description');

/**
 * @function setPinDescription
 * @param {string} description
 * @param {Pin} pin
 * @returns {Pin}
 */
export const setPinDescription = Utils.assocString('description');

/**
 * @function getPinOrder
 * @param {Pin} pin
 * @returns {number}
 */
export const getPinOrder = R.propOr(0, 'order');

/**
 * @function setPinOrder
 * @param {number} order
 * @param {Pin} pin
 * @returns {Pin}
 */
export const setPinOrder = Utils.assocNumber('order');

/**
 * @function isInputPin
 * @param {Pin} pin
 * @returns {boolean}
 */
export const isInputPin = R.compose(
  R.equals(CONST.PIN_DIRECTION.INPUT),
  R.propOr(false, 'direction')
);

/**
 * @function isOutputPin
 * @param {Pin} pin
 * @returns {boolean}
 */
export const isOutputPin = R.compose(
  R.equals(CONST.PIN_DIRECTION.OUTPUT),
  R.propOr(false, 'direction')
);

/**
 * Validates for correct pin type
 *
 * @function validatePinType
 * @param {PIN_TYPE} type
 * @returns {Either<Error|PIN_TYPE>}
 */
export const validatePinType = R.ifElse(
  R.flip(Utils.isValueInDictionary)(CONST.PIN_TYPE),
  Either.of,
  Utils.leaveError(CONST.ERROR.PIN_TYPE_INVALID)
);

/**
 * Validates for correct pin direction
 *
 * @function validatePinDirection
 * @param {PIN_DIRECTION} type
 * @returns {Either<Error|PIN_DIRECTION>}
 */
export const validatePinDirection = R.ifElse(
  R.flip(Utils.isValueInDictionary)(CONST.PIN_DIRECTION),
  Either.of,
  Utils.leaveError(CONST.ERROR.PIN_DIRECTION_INVALID)
);

/**
 * Validates for correct pin
 *
 * @function validatePin
 * @param {Pin} pin
 * @returns {Either<Error|Pin>}
 */
export const validatePin = pin => {
  const type = getPinType(pin);
  const direction = getPinDirection(pin);
  const key = getPinKey(pin);

  return validatePinType(type).chain(
    () => validatePinDirection(direction).chain(
      () => Utils.validatePath(key).map(
        () => pin
      )
    )
  );
};

/**
 * @function createPin
 * @param {string} key
 * @param {PIN_TYPE} type
 * @param {PIN_DIRECTION} direction
 * @returns {Either<Error|Pin>}
 */
export const createPin = R.curry(
  (key, type, direction) => validatePin({ key, type, direction })
);
