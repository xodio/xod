// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from 'chai';

import { readFileSync } from 'fs';
import { resolve } from 'path';
import R from 'ramda';
import { Either, Maybe } from 'ramda-fantasy';
import { foldEither, mapIndexed } from 'xod-func-tools';

import * as XP from '../src';

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
  direction: XP.PIN_DIRECTION.INPUT,
  label: '$$defaultLabel',
  type: XP.PIN_TYPE.NUMBER,
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
        type: XP.getTerminalPath(direction, type),
        position: { x: index, y: 0 },
      },
    ])
  )(types)
);

export const createPatchStub = R.curry(
  (extraNodes, inputTypes, outputTypes) => ({
    nodes: R.mergeAll([
      extraNodes,
      generateTerminals(XP.PIN_DIRECTION.INPUT, inputTypes),
      generateTerminals(XP.PIN_DIRECTION.OUTPUT, outputTypes),
    ]),
  })
);

export const createAbstractPatch = R.compose(
  defaultizePatch,
  createPatchStub({
    abstarct: { type: XP.ABSTRACT_MARKER_PATH },
  })
);

export const createSpecializationPatch = R.compose(
  defaultizePatch,
  createPatchStub({
    niix: { type: XP.NOT_IMPLEMENTED_IN_XOD_PATH },
  })
);

// Prepares patch for structural comparison.
// Replacing node ids with deterministically computed ones,
// and omits link ids
// :: (Node -> String) -> Patch -> { nodes: [Node], links: [LinkWithoutId] }
const derandomizeEntityIds = (computeNodeId, patch) => {
  const originalNodes = XP.listNodes(patch);

  // check that generated ids are unique for a given patch
  const nodesWithTheSameComputedIds = R.compose(
    R.find(ns => ns.length > 1),
    R.values,
    R.groupBy(computeNodeId)
  )(originalNodes);

  assert.isUndefined(
    nodesWithTheSameComputedIds,
    'computeNodeId must generate unique ids'
  );

  // :: OriginalId -> ComputedId
  const getReplacementId = R.compose(
    R.flip(R.prop),
    R.fromPairs,
    R.map(n => [XP.getNodeId(n), computeNodeId(n)])
  )(originalNodes);

  const nodes = R.map(
    R.over(R.lensProp('id'), getReplacementId),
    originalNodes
  );

  const links = R.compose(
    R.map(
      R.compose(
        R.dissoc('id'),
        R.over(R.lensPath(['input', 'nodeId']), getReplacementId),
        R.over(R.lensPath(['output', 'nodeId']), getReplacementId)
      )
    ),
    XP.listLinks
  )(patch);

  return {
    nodes,
    links,
  };
};

export const assertPatchesAreStructurallyEqual = (
  computeNodeId,
  actual,
  expected
) => {
  const dActual = derandomizeEntityIds(computeNodeId, actual);
  const dExpected = derandomizeEntityIds(computeNodeId, expected);

  assert.sameDeepMembers(
    dActual.nodes,
    dExpected.nodes,
    'nodes are structurally equal'
  );
  assert.sameDeepMembers(
    dActual.links,
    dExpected.links,
    'links are structurally equal'
  );
};

// Loading files

export const loadJSON = R.compose(
  JSON.parse,
  filePath => readFileSync(filePath, 'utf8'),
  filePath => resolve(__dirname, filePath)
);

export const loadXodball = R.compose(XP.fromXodballDataUnsafe, loadJSON);
