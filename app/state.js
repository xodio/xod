
import R from 'ramda';

import * as EDITOR_MODE from './constants/editorModes';
import * as PIN_DIRECTION from './constants/pinDirection';

/* eslint-disable global-require */
const nodeMetas = {
  button: require('../nodes/meta/button.json5'),
  constBool: require('../nodes/meta/constBool.json5'),
  constNumber: require('../nodes/meta/constNumber.json5'),
  constString: require('../nodes/meta/constString.json5'),
  either: require('../nodes/meta/either.json5'),
  latch: require('../nodes/meta/latch.json5'),
  led: require('../nodes/meta/led.json5'),
  map: require('../nodes/meta/map.json5'),
  not: require('../nodes/meta/not.json5'),
  pot: require('../nodes/meta/pot.json5'),
  servo: require('../nodes/meta/servo.json5'),
  inputBool: require('../nodes/meta/inputBool.json5'),
  inputNumber: require('../nodes/meta/inputNumber.json5'),
  inputString: require('../nodes/meta/inputString.json5'),
  outputBool: require('../nodes/meta/outputBool.json5'),
  outputNumber: require('../nodes/meta/outputNumber.json5'),
  outputString: require('../nodes/meta/outputString.json5'),
};
/* eslint-enable global-require */

function loadImpl(platform, key, ext) {
  try {
    /* eslint-disable global-require, prefer-template */
    return require('!raw!../nodes/' + platform + '/' + key + ext);
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
  R.indexBy(R.prop('id')),
  R.values,
  R.mapObjIndexed((meta, key, metas) => R.merge(
    R.omit(['inputs', 'outputs'], meta),
    {
      id: R.indexOf(key, R.keys(metas)) + 1,
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
        pins: {},
        links: {},
      },
      2: {
        id: 2,
        name: 'AUX',
        nodes: {},
        pins: {},
        links: {},
      },
    },
    nodeTypes,
    folders: {},
    counter: {
      patches: 2,
      nodes: 0,
      pins: 0,
      links: 0,
      nodeTypes: +maxKey(nodeTypes) + 1,
      folders: 0,
    },
  },
  editor: {
    currentPatchId: 1,
    mode: EDITOR_MODE.EDITING,
    dragging: null,
    selection: [],
    linkingPin: null,
    selectedNodeType: 1,
    tabs: {
      1: {
        id: 1,
        patchId: 1,
        index: 0,
      },
    },
  },
  errors: {},
  processes: {},
};

export default initialState;
