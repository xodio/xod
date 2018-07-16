import * as R from 'ramda';
import * as CONST from './constants';
import { def } from './types';
import { isGenericType } from './utils';

/**
 * An object representing patch pin
 * @typedef {Object} Pin
 */

/**
 * A {@link Pin} object or just its key as {@link string}
 * @typedef {(Pin|string)} PinOrKey
 */

/**
 * @private
 * @function createPin
 * @param {string} key
 * @param {PIN_TYPE} type
 * @param {PIN_DIRECTION} direction
 * @returns {Pin}
 */
export const createPin = def(
  'createPin :: PinKey -> DataType -> PinDirection -> Number -> PinLabel -> String -> Boolean -> DataValue -> Pin',
  (
    key,
    type,
    direction,
    order,
    label,
    description,
    isBindable,
    defaultValue
  ) => ({
    '@@type': 'xod-project/Pin',
    key,
    type,
    direction,
    label,
    description,
    order,
    isBindable,
    defaultValue,
  })
);

/**
 * @private
 */
export const createDeadPin = def(
  'createDeadPin :: PinKey -> PinDirection -> Number -> Pin',
  (pinKey, direction, order) =>
    createPin(
      pinKey,
      CONST.PIN_TYPE.DEAD,
      direction,
      order,
      '',
      '',
      false,
      CONST.DEFAULT_VALUE_OF_TYPE[CONST.PIN_TYPE.DEAD]
    )
);

// =============================================================================
//
// Getters
//
// =============================================================================

/**
 * @function getPinType
 * @param {Pin} pin
 * @returns {PIN_TYPE}
 */
export const getPinType = def('getPinType :: Pin -> DataType', R.prop('type'));

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
  'getPinLabel :: Pin -> PinLabel',
  R.prop('label')
);

/**
 * @function getPinDefaultValue
 * @param {Pin} pin
 * @returns {DataValue}
 */
export const getPinDefaultValue = def(
  'getPinDefaultValue :: Pin -> DataValue',
  R.prop('defaultValue')
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
 * @function getPinOrder
 * @param {Pin} pin
 * @returns {number}
 */
export const getPinOrder = def('getPinOrder :: Pin -> Number', R.prop('order'));

/**
 * Is it possible to bind a value to this pin?
 *
 * Only output pins of functional patches are unbindable.
 * So this basically tells if this pin is an output pin of a functional patch.
 */
export const isPinBindable = def(
  'isBindable :: Pin -> Boolean',
  R.prop('isBindable')
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
  R.compose(R.flip(R.contains)(R.values(CONST.TERMINAL_PIN_KEYS)), getPinKey)
);

/**
 * Checks pin type to be Pulse
 * TODO: Add functions for other types when needed.
 */
export const isPulsePin = def(
  'isPulsePin :: Pin -> Boolean',
  R.compose(R.equals(CONST.PIN_TYPE.PULSE), getPinType)
);

export const isGenericPin = def(
  'isGenericPin :: Pin -> Boolean',
  R.compose(isGenericType, getPinType)
);

// =============================================================================
//
// Setters
// Only for private using in this module, cause Pins is a read-only entity.
// Don't export them!
//
// =============================================================================

export const setPinLabel = def(
  'setPinLabel :: PinLabel -> Pin -> Pin',
  R.assoc('label')
);

export const setPinValue = def(
  'setPinValue :: DataValue -> Pin -> Pin',
  R.assoc('value')
);

export const setPinKey = def(
  'setPinKey :: PinKey -> Pin -> Pin',
  R.assoc('key')
);

export const setPinOrder = def(
  'setPinOrder :: Number -> Pin -> Pin',
  R.assoc('order')
);

// =============================================================================
//
// Utils
//
// =============================================================================

const isPinLabelEmpty = def(
  'isPinLabelEmpty :: Pin -> Boolean',
  R.compose(R.isEmpty, getPinLabel)
);

/**
 * Returns a default Pin label by direction.
 * Useful when label is empty, but we need to name
 * a label somehow. So output Pin with empty label
 * becomes a Pin with label "OUT".
 */
const getPinLabelByDirection = def(
  'getPinLabelByDirection :: Pin -> PinLabel',
  R.compose(R.prop(R.__, CONST.PIN_LABEL_BY_DIRECTION), getPinDirection)
);

/**
 * Gives pins with empty labels unique names
 * E.G.,
 * - "" (input) -> "IN1"
 * - "" (input) -> "IN2"
 * - "" (output) -> "OUT"
 */
export const normalizeEmptyPinLabels = def(
  'normalizeEmptyPinLabels :: [Pin] -> [Pin]',
  R.compose(
    R.unnest,
    R.over(
      R.lensIndex(0),
      R.compose(
        R.unnest,
        R.values,
        R.map(
          R.when(
            R.compose(R.gt(R.__, 1), R.length),
            R.addIndex(R.map)((pin, idx) =>
              setPinLabel(`${getPinLabel(pin)}${idx + 1}`, pin)
            )
          )
        ),
        R.groupBy(getPinLabel),
        R.map(pin => setPinLabel(getPinLabelByDirection(pin), pin))
      )
    ),
    R.partition(isPinLabelEmpty)
  )
);

export const addVariadicPinKeySuffix = def(
  'addVariadicPinKeySuffix :: Number -> PinKey -> PinKey',
  (index, key) => `${key}-$${index}`
);

/**
 * (!) This function should be called only for variadic pins,
 * that should have an updated label.
 *
 * Returns PinLabel by incrementing it in accordance with rules.
 * - "FOO" -> "FOO2"
 * - "X7" -> "X8"
 * - "" -> ""
 *
 * Accepts an index of the additional variadic pin as the first
 * argument and a label of the original variadic Pin.
 * E.G.
 * Node has `arityLevel === 4` and variadic pin with label 'FOO'.
 * This function will be called with these arguments:
 * - 0, 'FOO' -> 'FOO2'
 * - 1, 'FOO' -> 'FOO3'
 * - 2, 'FOO' -> 'FOO4'
 */
export const induceVariadicPinLabel = def(
  'induceVariadicPinLabel :: Number -> PinLabel -> PinLabel',
  (index, label) =>
    R.unless(
      R.isEmpty,
      R.compose(
        R.converge(R.concat, [
          R.nth(1),
          R.compose(
            R.toString,
            R.add(index + 1),
            R.defaultTo(1),
            x => parseInt(x, 10),
            R.nth(2)
          ),
        ]),
        R.match(/^(\D+)(\d*)$/)
      )
    )(label)
);

/**
 * Returns True for Pin with `dead` type
 * and False for any other type.
 */
export const isDeadPin = def(
  'isDeadPin :: Pin -> Boolean',
  R.compose(R.equals(CONST.PIN_TYPE.DEAD), getPinType)
);
