import R from 'ramda';
import * as Tools from './func-tools';
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
export const setPinLabel = Tools.assocString('label');

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
export const setPinDescription = Tools.assocString('description');

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
export const setPinOrder = Tools.assocNumber('order');

/**
 * @function isInputPin
 * @param {Pin} pin
 * @returns {boolean}
 */
export const isInputPin = R.propEq('direction', CONST.PIN_DIRECTION.INPUT);

/**
 * @function isOutputPin
 * @param {Pin} pin
 * @returns {boolean}
 */
export const isOutputPin = R.propEq('direction', CONST.PIN_DIRECTION.OUTPUT);

/**
 * @function isTerminalPin
 * @param {Pin} pin
 * @returns {boolean}
 */
export const isTerminalPin = R.compose(
  R.anyPass([
    R.equals('__in__'),
    R.equals('__out__'),
  ]),
  getPinKey
);

/**
 * Validates for correct pin type
 *
 * @function validatePinType
 * @param {PIN_TYPE} type
 * @returns {Either<Error|PIN_TYPE>}
 */
export const validatePinType = Tools.errOnFalse(
  CONST.ERROR.PIN_TYPE_INVALID,
  R.flip(Tools.hasPropEq)(CONST.PIN_TYPE)
);

/**
 * Validates for correct pin direction
 *
 * @function validatePinDirection
 * @param {PIN_DIRECTION} type
 * @returns {Either<Error|PIN_DIRECTION>}
 */
export const validatePinDirection = Tools.errOnFalse(
  CONST.ERROR.PIN_DIRECTION_INVALID,
  R.flip(Tools.hasPropEq)(CONST.PIN_DIRECTION)
);

/**
 * Validates for correct pin key
 *
 * @function validatePinKey
 * @param {string} pinKey
 * @returns {Either<Error|string>}
 */
export const validatePinKey = Tools.errOnFalse(
  CONST.ERROR.PIN_KEY_INVALID,
  Utils.validateId
);

/**
 * Validates pin correctness
 *
 * @function validatePin
 * @param {Pin} pin
 * @returns {Either<Error|Pin>}
 */
export const validatePin = pin => validatePinType(getPinType(pin))
  .chain(() => validatePinDirection(getPinDirection(pin)))
  .chain(() => validatePinKey(getPinKey(pin)))
  .map(R.always(pin));

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
