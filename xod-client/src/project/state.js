import { getNodeTypes, getInitialState } from 'xod-core/project/state';

export * from 'xod-core/project/state';

/* eslint-disable global-require */
const nodeMetas = {
  'core/button': require('../../../xod-core/nodes/meta/button.json5'),
  'core/constBool': require('../../../xod-core/nodes/meta/constBool.json5'),
  'core/constNumber': require('../../../xod-core/nodes/meta/constNumber.json5'),
  'core/constString': require('../../../xod-core/nodes/meta/constString.json5'),
  'core/either': require('../../../xod-core/nodes/meta/either.json5'),
  'core/latch': require('../../../xod-core/nodes/meta/latch.json5'),
  'core/led': require('../../../xod-core/nodes/meta/led.json5'),
  'core/map': require('../../../xod-core/nodes/meta/map.json5'),
  'core/not': require('../../../xod-core/nodes/meta/not.json5'),
  'core/pot': require('../../../xod-core/nodes/meta/pot.json5'),
  'core/servo': require('../../../xod-core/nodes/meta/servo.json5'),
  'core/inputBool': require('../../../xod-core/nodes/meta/inputBool.json5'),
  'core/inputNumber': require('../../../xod-core/nodes/meta/inputNumber.json5'),
  'core/inputString': require('../../../xod-core/nodes/meta/inputString.json5'),
  'core/outputBool': require('../../../xod-core/nodes/meta/outputBool.json5'),
  'core/outputNumber': require('../../../xod-core/nodes/meta/outputNumber.json5'),
  'core/outputString': require('../../../xod-core/nodes/meta/outputString.json5'),
};
/* eslint-enable global-require */

function loadImpl(platform, key, ext) {
  try {
    /* eslint-disable global-require, prefer-template */
    return require('!raw!../../../xod-espruino/nodes/' + platform
                   + '/' + key.replace('core/', '') + ext);
    /* eslint-enable global-require, prefer-template */
  } catch (err) {
    if (/Cannot find module/.test(err)) {
      return null;
    }

    throw err;
  }
}

export const nodeTypes = getNodeTypes(loadImpl, nodeMetas);

const initialState = getInitialState(nodeTypes);
export default initialState;
