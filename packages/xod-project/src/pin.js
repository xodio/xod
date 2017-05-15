import R from 'ramda';
import * as Utils from './utils';
import * as CONST from './constants';
import { def } from './types';

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
export const getPinType = def(
  'getPinType :: Pin -> DataType',
  R.prop('type')
);

/**
 * @function getPinDirection
 * @param {Pin} pin
 * @returns {PIN_DIRECTION}
 */
export const getPinDirection = def(
  'getPinDirection :: Pin -> PinDirection',
  R.prop('direction')
);

/**
 * @function getPinKey
 * @param {Pin} pin
 * @returns {string}
 */
export const getPinKey = def(
  'getPinKey :: PinOrKey -> PinKey',
  R.ifElse(R.is(String), R.identity, R.prop('key'))
);

/**
 * @function getPinLabel
 * @param {Pin} pin
 * @returns {string}
 */
export const getPinLabel = def(
  'getPinLabel :: Pin -> String',
  R.prop('label')
);

/**
 * @function getPinValue
 * @param {Pin} pin
 * @returns {DataValue}
 */
export const getPinValue = def(
  'getPinValue :: Pin -> DataValue',
  R.prop('value')
);

/**
 * @private
 * @function setPinLabel
 * @param {string} label
 * @param {Pin} pin
 * @returns {Pin}
 */
export const setPinLabel = def(
  'setPinLabel :: String -> Pin -> Pin',
  R.assoc('label')
);

/**
 * @function getPinDescription
 * @param {Pin} pin
 * @returns {string}
 */
export const getPinDescription = def(
  'getPinDescription :: Pin -> String',
  R.prop('description')
);

/**
 * @private
 * @function setPinDescription
 * @param {string} description
 * @param {Pin} pin
 * @returns {Pin}
 */
export const setPinDescription = def(
  'setPinDescription :: String -> Pin -> Pin',
  R.assoc('description')
);

/**
 * @function getPinOrder
 * @param {Pin} pin
 * @returns {number}
 */
export const getPinOrder = def(
  'getPinOrder :: Pin -> Number',
  R.prop('order')
);

/**
 * @private
 * @function setPinOrder
 * @param {number} order
 * @param {Pin} pin
 * @returns {Pin}
 */
export const setPinOrder = def(
  'setPinOrder :: Number -> Pin -> Pin',
  R.assoc('order')
);

/**
 * @function isInputPin
 * @param {Pin} pin
 * @returns {boolean}
 */
export const isInputPin = def(
  'isInputPin :: Pin -> Boolean',
  R.propEq('direction', CONST.PIN_DIRECTION.INPUT)
);

/**
 * @function isOutputPin
 * @param {Pin} pin
 * @returns {boolean}
 */
export const isOutputPin = def(
  'isOutputPin :: Pin -> Boolean',
  R.propEq('direction', CONST.PIN_DIRECTION.OUTPUT)
);

/**
 * Checks that a pin belongs to a terminal patch.
 *
 * @function isTerminalPin
 * @param {Pin} pin
 * @returns {boolean}
 */
export const isTerminalPin = def(
  'isTerminalPin :: Pin -> Boolean',
  R.compose(
    R.flip(R.contains)(R.values(CONST.TERMINAL_PIN_KEYS)),
    getPinKey
  )
);

/**
 * @private
 * @function createPin
 * @param {string} key
 * @param {PIN_TYPE} type
 * @param {PIN_DIRECTION} direction
 * @returns {Pin}
 */
export const createPin = def(
  'createPin :: PinKey -> DataType -> PinDirection -> Number -> Pin',
  (key, type, direction, order) => ({
    key,
    type,
    direction,
    label: key,
    description: '',
    order,
    value: Utils.defaultValueOfType(type), // TODO: support 'custom' default values
  })
);
