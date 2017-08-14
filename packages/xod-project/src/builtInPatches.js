import R from 'ramda';

import {
  PIN_TYPE,
  PIN_DIRECTION as DIRECTION,
  OPPOSITE_DIRECTION,
  TERMINAL_PIN_KEYS,
  NOT_IMPLEMENTED_IN_XOD_PATH,
  DEFAULT_VALUE_OF_TYPE,
} from './constants';

import {
  getTerminalPath,
  getInternalTerminalPath,
} from './patchPathUtils';

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

  return {
    [pinKey]: {
      '@@type': 'xod-project/Patch',
      key: pinKey,
      type,
      direction: OPPOSITE_DIRECTION[direction],
      label: direction === DIRECTION.INPUT ? 'OUT' : 'IN',
      description: '',
      order: 0,
      defaultValue: DEFAULT_VALUE_OF_TYPE[type],
      isBindable: true, // terminal's pins are always bindable
    },
  };
});

export const PINS_OF_PATCH_NODES = R.compose(
  R.fromPairs,
  R.append([
    NOT_IMPLEMENTED_IN_XOD_PATH,
    {},
  ]),
  R.ap([ // [[patchBaseName, patchPins]] for each type and direction
    R.juxt([ // TODO: make more DRY or more readable?
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

export const BUILT_IN_PATCH_PATHS = R.keys(PINS_OF_PATCH_NODES);

const TERMINAL_NODE_PINS = R.compose(
  R.fromPairs,
  R.map(
    R.juxt([
      getInternalTerminalPath,
      R.converge(
        R.merge,
        R.compose(
          R.map(getTerminalPins),
          R.values
        )(DIRECTION)
      ),
    ])
  ),
  R.values
)(PIN_TYPE);

// :: PatchPath -> (StrMap Pin) | Null
export const getHardcodedPinsForPatchPath =
  R.flip(R.prop)(R.merge(
    PINS_OF_PATCH_NODES,
    TERMINAL_NODE_PINS
  ));
