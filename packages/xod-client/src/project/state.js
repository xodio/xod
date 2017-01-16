// TODO: Replace this hard-coded state with nodeType providers and empty defaults

/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

import { genNodeTypes, getInitialState } from 'xod-core';

require('json5/lib/require');
const nodeMetas = {
  'xod/core/button': require('../../../xod-core/nodes/meta/button.json5'),
  'xod/core/constBool': require('../../../xod-core/nodes/meta/constBool.json5'),
  'xod/core/constNumber': require('../../../xod-core/nodes/meta/constNumber.json5'),
  'xod/core/constString': require('../../../xod-core/nodes/meta/constString.json5'),
  'xod/core/either': require('../../../xod-core/nodes/meta/either.json5'),
  'xod/core/latch': require('../../../xod-core/nodes/meta/latch.json5'),
  'xod/core/clock': require('../../../xod-core/nodes/meta/clock.json5'),
  'xod/core/led': require('../../../xod-core/nodes/meta/led.json5'),
  'xod/core/ultrasonic_HC_SR04': require('../../../xod-core/nodes/meta/ultrasonic_HC_SR04.json5'),
  'xod/core/map': require('../../../xod-core/nodes/meta/map.json5'),
  'xod/core/not': require('../../../xod-core/nodes/meta/not.json5'),
  'xod/core/and': require('../../../xod-core/nodes/meta/and.json5'),
  'xod/core/or': require('../../../xod-core/nodes/meta/or.json5'),
  'xod/core/valveNumber': require('../../../xod-core/nodes/meta/valveNumber.json5'),
  'xod/core/triggerableNumber': require('../../../xod-core/nodes/meta/triggerableNumber.json5'),
  'xod/core/compare': require('../../../xod-core/nodes/meta/compare.json5'),
  'xod/core/pot': require('../../../xod-core/nodes/meta/pot.json5'),
  'xod/core/servo': require('../../../xod-core/nodes/meta/servo.json5'),
  'xod/core/buzzer': require('../../../xod-core/nodes/meta/buzzer.json5'),
  'xod/core/inputBool': require('../../../xod-core/nodes/meta/inputBool.json5'),
  'xod/core/inputNumber': require('../../../xod-core/nodes/meta/inputNumber.json5'),
  'xod/core/inputString': require('../../../xod-core/nodes/meta/inputString.json5'),
  'xod/core/outputBool': require('../../../xod-core/nodes/meta/outputBool.json5'),
  'xod/core/outputNumber': require('../../../xod-core/nodes/meta/outputNumber.json5'),
  'xod/core/outputString': require('../../../xod-core/nodes/meta/outputString.json5'),
};
/* eslint-enable global-require */

function loadImpl(platform, key, ext) {
  try {
    /* eslint-disable global-require, prefer-template */
    return require('!raw!../../../xod-js/platform/nodes/' + platform
                   + '/' + key.replace('xod/core/', '') + ext);
    /* eslint-enable global-require, prefer-template */
  } catch (err) {
    if (/Cannot find module/.test(err)) {
      return null;
    }

    throw err;
  }
}

export const nodeTypes = genNodeTypes(loadImpl, nodeMetas);

const initialState = getInitialState(nodeTypes);
export default initialState;
