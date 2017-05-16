import R from 'ramda';

import {
  PIN_TYPE,
  PIN_DIRECTION,
  TERMINAL_PIN_KEYS,
  NOT_IMPLEMENTED_IN_XOD_PATH,
} from './constants';

import {
  getTerminalPath,
  getInternalTerminalPath,
} from './patchPathUtils';

const getOutputPatchPins = type => ({
  [TERMINAL_PIN_KEYS[PIN_DIRECTION.INPUT]]: {
    key: TERMINAL_PIN_KEYS[PIN_DIRECTION.INPUT],
    type,
    direction: PIN_DIRECTION.INPUT,
    label: 'IN',
    description: '',
    order: 0,
    value: '',
  },
});

const getInputPatchPins = type => ({
  [TERMINAL_PIN_KEYS[PIN_DIRECTION.OUTPUT]]: {
    key: TERMINAL_PIN_KEYS[PIN_DIRECTION.OUTPUT],
    type,
    direction: PIN_DIRECTION.OUTPUT,
    label: 'OUT',
    description: '',
    order: 0,
    value: '',
  },
});

export const PINS_OF_PATCH_NODES = R.compose(
  R.fromPairs,
  R.append([
    NOT_IMPLEMENTED_IN_XOD_PATH,
    {},
  ]),
  R.ap([ // [[patchBaseName, patchPins]] for each type and direction
    R.juxt([
      getTerminalPath(PIN_DIRECTION.OUTPUT),
      getOutputPatchPins,
    ]),
    R.juxt([
      getTerminalPath(PIN_DIRECTION.INPUT),
      getInputPatchPins,
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
        [
          getInputPatchPins,
          getOutputPatchPins,
        ]
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
