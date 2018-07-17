// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from 'chai';

import { readFileSync } from 'fs';
import { resolve } from 'path';
import R from 'ramda';
import { Either, Maybe } from 'ramda-fantasy';
import { foldEither, mapIndexed } from 'xod-func-tools';

import {
  PIN_DIRECTION,
  PIN_TYPE,
  ABSTRACT_MARKER_PATH,
  NOT_IMPLEMENTED_IN_XOD_PATH,
} from '../src/constants';
import { fromXodballDataUnsafe } from '../src/xodball';
import { getTerminalPath } from '../src/patchPathUtils';

export const expectEitherRight = R.curry((testFunction, object) => {
  foldEither(
    err => assert(false, `Expected Either.Right, but got Either.Left: ${err}`),
    testFunction,
    object
  );
});

export const expectEitherError = R.curry((originalMessage, err) => {
  const check = errObj => {
    assert.typeOf(errObj, 'Error');
    assert.strictEqual(
      errObj.message,
      originalMessage,
      `Expected Error with message "${originalMessage}", but got Error: ${
        err.message
      }`
    );
  };

  if (!Either.isLeft(err)) {
    assert(false, `Expected Either.Left, but got: ${err}`);
  }

  foldEither(
    check,
    val => assert(false, `Expected Either.Left, but got Either.Right: ${val}`),
    err
  );
});

export const expectMaybeNothing = maybeActual =>
  assert(
    Maybe.isNothing(maybeActual),
    'Expected Maybe.Nothing, bot got Maybe.Just'
  );

export const expectMaybeJust = R.curry((maybeActual, expected) => {
  if (Maybe.isNothing(maybeActual)) {
    assert(false, 'Expected Maybe.Just, bot got Maybe.Nothing');
    return;
  }

  const actual = Maybe.maybe(null, R.identity, maybeActual);
  assert.deepEqual(actual, expected);
});

export const assertProps = (actual, expected) =>
  R.forEachObjIndexed((v, k) => assert.deepPropertyVal(actual, k, v), expected);

//-----------------------------------------------------------------------------
// Defaultizers
//-----------------------------------------------------------------------------

export const defaultizeComment = R.merge({
  id: '$$defaultLinkId',
  position: { x: 0, y: 0 },
  size: { width: 100, height: 100 },
  content: '',
});

export const defaultizeLink = R.merge({
  '@@type': 'xod-project/Link',
  id: '$$defaultLinkId',
  input: { nodeId: '$$defaultInputNodeId', pinKey: '$$defaultInputPin' },
  output: { nodeId: '$$defaultOutputNodeId', pinKey: '$$defaultOutputPin' },
});

export const defaultizeNode = R.merge({
  '@@type': 'xod-project/Node',
  id: '$$defaultNodeId',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  type: '@/default-type',
  label: '',
  description: '',
  boundLiterals: {},
  arityLevel: 1,
});

export const defaultizePin = R.merge({
  '@@type': 'xod-project/Pin',
  key: '$$defaultPinKey',
  direction: PIN_DIRECTION.INPUT,
  label: '$$defaultLabel',
  type: PIN_TYPE.NUMBER,
  defaultValue: 0,
  order: 0,
  description: '$$defaultDesription',
  isBindable: true,
});

const assignIds = R.mapObjIndexed((entity, id) => R.assoc('id', id, entity));

export const defaultizePatch = R.compose(
  R.evolve({
    nodes: R.compose(assignIds, R.map(defaultizeNode)),
    links: R.compose(assignIds, R.map(defaultizeLink)),
    comments: R.compose(assignIds, R.map(defaultizeComment)),
  }),
  R.merge({
    '@@type': 'xod-project/Patch',
    nodes: {},
    links: {},
    comments: {},
    path: '@/default-patch-path',
    description: '',
    attachments: [],
  })
);

export const insertPatchPaths = R.evolve({
  patches: R.mapObjIndexed((patch, path) => R.assoc('path', path, patch)),
});

export const defaultizeProject = R.compose(
  insertPatchPaths,
  R.evolve({
    patches: R.map(defaultizePatch),
  }),
  R.merge({
    '@@type': 'xod-project/Project',
    authors: [],
    license: '',
    description: '',
    version: '0.0.0',
    patches: {},
    name: 'test-project-name',
  })
);

// Generate stuff to use with defaultize*

const generateTerminals = R.curry((direction, types) =>
  R.compose(
    R.fromPairs,
    mapIndexed((type, index) => [
      `${direction}-${index}-${type}`,
      {
        type: getTerminalPath(direction, type),
        position: { x: index, y: 0 },
      },
    ])
  )(types)
);

export const createPatchStub = R.curry(
  (extraNodes, inputTypes, outputTypes) => ({
    nodes: R.mergeAll([
      extraNodes,
      generateTerminals(PIN_DIRECTION.INPUT, inputTypes),
      generateTerminals(PIN_DIRECTION.OUTPUT, outputTypes),
    ]),
  })
);

export const createAbstractPatch = R.compose(
  defaultizePatch,
  createPatchStub({
    abstarct: { type: ABSTRACT_MARKER_PATH },
  })
);

export const createSpecializationPatch = R.compose(
  defaultizePatch,
  createPatchStub({
    niix: { type: NOT_IMPLEMENTED_IN_XOD_PATH },
  })
);

// Loading files

export const loadJSON = R.compose(
  JSON.parse,
  filePath => readFileSync(filePath, 'utf8'),
  filePath => resolve(__dirname, filePath)
);

export const loadXodball = R.compose(fromXodballDataUnsafe, loadJSON);
