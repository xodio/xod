
import R from 'ramda';

import * as EDITOR_MODE from './constants/editorModes';
import * as PIN_DIRECTION from './constants/pinDirection';

/* eslint-disable global-require */
const nodeMetas = {
  button: require('../nodes/meta/button.json5'),
  constBool: require('../nodes/meta/constBool.json5'),
  either: require('../nodes/meta/either.json5'),
  latch: require('../nodes/meta/latch.json5'),
  led: require('../nodes/meta/led.json5'),
  map: require('../nodes/meta/map.json5'),
  not: require('../nodes/meta/not.json5'),
  pot: require('../nodes/meta/pot.json5'),
  servo: require('../nodes/meta/servo.json5'),
};
/* eslint-enable global-require */

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
    counter: {
      patches: 1,
      nodes: 1,
      pins: 1,
      links: 1,
      nodeTypes: +maxKey(nodeTypes) + 1,
    },
  },
  editor: {
    currentPatchId: 1,
    mode: EDITOR_MODE.EDITING,
    dragging: null,
    selection: [],
    linkingPin: null,
    selectedNodeType: 1,
  },
  errors: {},
  processes: {},
};

export default initialState;
