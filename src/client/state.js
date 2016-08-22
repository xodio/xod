
import R from 'ramda';

import { state as editorState } from 'xod/client/editor';
import * as PIN_DIRECTION from './constants/pinDirection';

/* eslint-disable global-require */
const nodeMetas = {
  'core/button': require('../../nodes/meta/button.json5'),
  'core/constBool': require('../../nodes/meta/constBool.json5'),
  'core/constNumber': require('../../nodes/meta/constNumber.json5'),
  'core/constString': require('../../nodes/meta/constString.json5'),
  'core/either': require('../../nodes/meta/either.json5'),
  'core/latch': require('../../nodes/meta/latch.json5'),
  'core/led': require('../../nodes/meta/led.json5'),
  'core/map': require('../../nodes/meta/map.json5'),
  'core/not': require('../../nodes/meta/not.json5'),
  'core/pot': require('../../nodes/meta/pot.json5'),
  'core/servo': require('../../nodes/meta/servo.json5'),
  'core/inputBool': require('../../nodes/meta/inputBool.json5'),
  'core/inputNumber': require('../../nodes/meta/inputNumber.json5'),
  'core/inputString': require('../../nodes/meta/inputString.json5'),
  'core/outputBool': require('../../nodes/meta/outputBool.json5'),
  'core/outputNumber': require('../../nodes/meta/outputNumber.json5'),
  'core/outputString': require('../../nodes/meta/outputString.json5'),
};
/* eslint-enable global-require */

function loadImpl(platform, key, ext) {
  try {
    /* eslint-disable global-require, prefer-template */
    return require('!raw!../../nodes/' + platform + '/' + key.replace('core/', '') + ext);
    /* eslint-enable global-require, prefer-template */
  } catch (err) {
    if (/Cannot find module/.test(err)) {
      return null;
    }

    throw err;
  }
}

R.mapDirectedNodeTypePins = (direction, collectionKey) => R.compose(
  R.indexBy(R.prop('key')),
  R.addIndex(R.map)((pin, index) => R.merge({ index, direction }, pin)),
  R.propOr([], collectionKey)
);

const mapNodeTypePins = meta => R.merge(
  R.mapDirectedNodeTypePins(PIN_DIRECTION.INPUT, 'inputs')(meta),
  R.mapDirectedNodeTypePins(PIN_DIRECTION.OUTPUT, 'outputs')(meta)
);

const mapNodeTypeProperties = R.compose(
  R.indexBy(R.prop('key')),
  R.propOr([], 'properties')
);

const removeNils = R.reject(R.isNil);

const nodeTypes = R.compose(
  R.indexBy(R.prop('key')),
  R.values,
  R.mapObjIndexed((meta, key) => R.merge(
    R.omit(['inputs', 'outputs'], meta),
    {
      key,
      pins: mapNodeTypePins(meta),
      properties: mapNodeTypeProperties(meta),
      impl: removeNils({
        js: loadImpl('js', key, '.js'),
        espruino: loadImpl('espruino', key, '.js'),
      }),
    }
  ))
)(nodeMetas);

const maxKey = R.compose(
  R.reduce(R.max, -Infinity),
  R.keys
);

const initialState = {
  project: {
    meta: {
      name: 'Awesome project',
      author: 'Amperka team',
    },
    patches: {
      1: {
        id: 1,
        name: 'Main',
        nodes: {},
        links: {},
      },
      2: {
        id: 2,
        name: 'AUX',
        nodes: {},
        links: {},
      },
    },
    nodeTypes,
    folders: {},
    counter: {
      patches: 2,
      nodes: 0,
      links: 0,
      nodeTypes: +maxKey(nodeTypes) + 1,
      folders: 0,
    },
  },
  editor: editorState,
  errors: {},
  processes: {},
};

export default initialState;
