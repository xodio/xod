import R from 'ramda';
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
  (key, type, direction, order, label, description, isBindable, defaultValue) => ({
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
export const getPinOrder = def(
  'getPinOrder :: Pin -> Number',
  R.prop('order')
);

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
  R.compose(
    R.flip(R.contains)(R.values(CONST.TERMINAL_PIN_KEYS)),
    getPinKey
  )
);

// =============================================================================
//
// Setters
// Only for private using in this module, cause Pins is a read-only entity.
// Don't export them!
//
// =============================================================================

const setPinLabel = def(
  'setPinLabel :: PinLabel -> Pin -> Pin',
  R.assoc('label')
);

// =============================================================================
//
// Utils
//
// =============================================================================

const isPinLabelEmpty = def(
  'isPinLabelEmpty :: Pin -> Boolean',
  R.compose(
    R.isEmpty,
    getPinLabel
  )
);

/**
 * Returns a default Pin label by direction.
 * Useful when label is empty, but we need to name
 * a label somehow. So output Pin with empty label
 * becomes a Pin with label "OUT".
 */
const getPinLabelByDirection = def(
  'getPinLabelByDirection :: Pin -> PinLabel',
  R.compose(
    R.prop(R.__, CONST.PIN_LABEL_BY_DIRECTION),
    getPinDirection
  )
);

/**
 * Returns a list of Pins with unique Pin Labels.
 * It adds a suffix "_N" (where N is a counter of equal labels)
 * to the label of each Pin.
 * Also, if Pin has an empty label it became "IN" or "OUT"
 * in dependency of its direction.
 * E.G., Pin labels will be converted into:
 * - "A" -> "A_0"
 * - "A" -> "A_1"
 * - "B" -> "B_0"
 * - "B" -> "B_1"
 * - "C" -> "C"
 * - "" (input) -> "IN_0"
 * - "" (input) -> "IN_1"
 * - "" (output) -> "OUT_0"
 *
 * This function is useful for transpilers, that want to use
 * normalized pin labels instead of shortIds (real pinKeys,
 * that refers to NodeIds) and in the clients to show which
 * pinKeys user can use in the native implementations.
 */
export const normalizePinLabels = def(
  'normalizePinLabels :: [Pin] -> [Pin]',
  R.compose(
    R.unnest,
    R.values,
    R.map(
      R.when(
        R.compose(
          R.gt(R.__, 1),
          R.length
        ),
        R.addIndex(R.map)(
          (pin, idx) => setPinLabel(`${getPinLabel(pin)}_${idx}`, pin)
        )
      )
    ),
    R.groupBy(getPinLabel),
    R.map(
      R.when(
        isPinLabelEmpty,
        pin => setPinLabel(getPinLabelByDirection(pin), pin)
      )
    )
  )
);
