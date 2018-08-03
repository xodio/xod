import * as R from 'ramda';

import { createPin } from './pin';

import {
  PIN_TYPE,
  PIN_DIRECTION as DIRECTION,
  OPPOSITE_DIRECTION,
  TERMINAL_PIN_KEYS,
  DEFAULT_VALUE_OF_TYPE,
} from './constants';

import {
  getTerminalPath,
  getInternalTerminalPath,
  getTerminalDataType,
  getTerminalDirection,
} from './patchPathUtils';

import { isBuiltInType } from './utils';

/**
 * Input terminal patches have output pins, and vice versa:
 *
 * +---------+   +-----O----+
 * |         |   |    IN    |
 * | input-* |   | output-* |
 * |   OUT   |   |          |
 * +----O----+   +----------+
 *
 */
export const getPinKeyForTerminalDirection = direction =>
  TERMINAL_PIN_KEYS[OPPOSITE_DIRECTION[direction]];

const getTerminalPins = R.curry((direction, type) => {
  const pinKey = TERMINAL_PIN_KEYS[OPPOSITE_DIRECTION[direction]];
  const label = direction === DIRECTION.INPUT ? 'OUT' : 'IN';
  const pin = createPin(
    pinKey,
    type,
    OPPOSITE_DIRECTION[direction],
    0, // order
    label,
    '', // description
    // bindable? terminal's pins are always bindable for built-in types
    isBuiltInType(type),
    R.propOr('', type, DEFAULT_VALUE_OF_TYPE)
  );

  return R.objOf(pinKey, pin);
});

export const getCustomTypeTerminalPins = R.converge(getTerminalPins, [
  getTerminalDirection,
  getTerminalDataType,
]);

// :: Map PatchPath (Map PinKey Pin)
export const TERMINAL_NODE_PINS = R.compose(
  R.fromPairs,
  R.ap([
    // [[patchBaseName, patchPins]] for each type and direction
    R.juxt([
      // TODO: make more DRY or more readable?
      getTerminalPath(DIRECTION.OUTPUT),
      getTerminalPins(DIRECTION.OUTPUT),
    ]),
    R.juxt([
      getTerminalPath(DIRECTION.INPUT),
      getTerminalPins(DIRECTION.INPUT),
    ]),
  ]),
  R.values
)(PIN_TYPE);

export const BUILT_IN_TERMINAL_PATCH_PATHS = R.keys(TERMINAL_NODE_PINS);

// :: Map PatchPath (Map PinKey Pin)
const INTERNAL_TERMINAL_NODE_PINS = R.compose(
  R.fromPairs,
  R.map(
    R.juxt([
      getInternalTerminalPath,
      R.converge(
        R.merge,
        R.compose(R.map(getTerminalPins), R.values)(DIRECTION)
      ),
    ])
  ),
  R.values
)(PIN_TYPE);

// :: PatchPath -> (StrMap Pin) | Null
export const getHardcodedPinsForPatchPath = R.flip(R.prop)(
  R.merge(TERMINAL_NODE_PINS, INTERNAL_TERMINAL_NODE_PINS)
);
