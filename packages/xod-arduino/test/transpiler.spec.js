import fs from 'fs';
import path from 'path';
import R from 'ramda';
import { assert } from 'chai';

import { explode, foldEither, explodeEither } from 'xod-func-tools';
import { loadProject } from 'xod-fs';
import { PIN_TYPE } from 'xod-project';
import { defaultizePin } from 'xod-project/test/helpers';
import { transpile, getInitialDirtyFlags, transformProject, getNodeIdsMap } from '../src/transpiler';

// Returns patch relative to repo’s `workspace` subdir
const wsPath = (...subpath) => path.resolve(__dirname, '../../../workspace', ...subpath);

describe('xod-arduino transpiler', () => {
  describe('correctly transpiles workspace fixture', () => {
    const testFixture = (projName) => {
      const expectedCpp = fs.readFileSync(
        wsPath(projName, '__fixtures__/arduino.cpp'),
        'utf-8'
      );

      return loadProject(wsPath(projName))
        .then(transformProject(R.__, '@/main'))
        .then(R.map(transpile))
        .then(explode)
        .then(result =>
          assert.strictEqual(result, expectedCpp, 'expected and actual C++ don’t match')
        );
    };

    specify('blink', () => testFixture('blink'));
    specify('two-button-switch', () => testFixture('two-button-switch'));
    specify('lcd-time', () => testFixture('lcd-time'));
    specify('count-with-feedback-loops', () => testFixture('count-with-feedback-loops'));
  });

  it('returns error for non-existing-patch entry point',
    () =>
      loadProject(wsPath('blink'))
        .then(transformProject(R.__, '@/non-existing-patch'))
        .then(R.map(transpile))
        .then(result => assert.ok(result.isLeft))
  );

  it('returns error if some native node has more than 7 outputs',
    () =>
      loadProject(wsPath('faulty'))
        .then(transformProject(R.__, '@/too-many-outputs-main'))
        .then(R.map(transpile))
        .then(foldEither(
          (err) => {
            assert.include(err.message, '@/too_many_outputs');
            assert.include(err.message, 'has more than 7 outputs');
          },
          () => assert(false, 'expecting Either.Left')
        ))
  );

  it('sorts nodes topologically', () =>
    loadProject(wsPath('blink'))
      .then(R.pipe(
        transformProject(R.__, '@/main'),
        explodeEither,
        R.prop('nodes')
      ))
      .then((nodes) => {
        const patchNames = R.compose(
          R.pluck('patchName'),
          R.pluck('patch')
        )(nodes);

        assert.deepEqual(patchNames, [
          'constant_number', // IVAL
          'constant_boolean', // EN
          'constant_number', // PORT
          'clock',
          'flip_flop',
          'digital_output',
        ]);

        const ids = R.pluck('id', nodes);
        assert.deepEqual(ids, [0, 1, 2, 3, 4, 5],
          'Node IDs were not arranged in topological order');
      })
  );
});

describe('getNodeIdsMap', () => {
  it('should return correct NodeIdsMap', () => {
    const expected = {
      By6HVYHZb: '3',
      rkwIEFrWb: '4',
      SyeDNFBWZ: '5',
    };

    return loadProject(wsPath('blink'))
      .then(transformProject(R.__, '@/main'))
      .then(R.map(getNodeIdsMap))
      .then(explode)
      .then(result => R.mapObjIndexed(
        (nodeId, origNodeId) => assert.propertyVal(result, origNodeId, nodeId),
        expected
      ));
  });
});

describe('getInitialDirtyFlags', () => {
  it('should return 0b11111111 if there are no pulse outputs', () => {
    assert.equal(
      getInitialDirtyFlags([]),
      0b11111111
    );

    assert.equal(
      getInitialDirtyFlags([
        defaultizePin({ order: 1, type: PIN_TYPE.BOOLEAN }),
        defaultizePin({ order: 0, type: PIN_TYPE.STRING }),
        defaultizePin({ order: 2, type: PIN_TYPE.NUMBER }),
      ]),
      0b11111111
    );
  });
  it('should set bits corresponding to pulse outputs to 0', () => {
    assert.equal(
      getInitialDirtyFlags([
        defaultizePin({ order: 0, type: PIN_TYPE.PULSE }),
        defaultizePin({ order: 1, type: PIN_TYPE.BOOLEAN }),
        defaultizePin({ order: 2, type: PIN_TYPE.NUMBER }),
      ]),
      0b11111101
    );

    assert.equal(
      getInitialDirtyFlags([
        defaultizePin({ order: 0, type: PIN_TYPE.PULSE }),
        defaultizePin({ order: 1, type: PIN_TYPE.BOOLEAN }),
        defaultizePin({ order: 2, type: PIN_TYPE.NUMBER }),
        defaultizePin({ order: 3, type: PIN_TYPE.PULSE }),
      ]),
      0b11101101
    );

    assert.equal(
      getInitialDirtyFlags([
        defaultizePin({ order: 0, type: PIN_TYPE.PULSE }),
        defaultizePin({ order: 1, type: PIN_TYPE.PULSE }),
        defaultizePin({ order: 2, type: PIN_TYPE.PULSE }),
        defaultizePin({ order: 3, type: PIN_TYPE.PULSE }),
        defaultizePin({ order: 4, type: PIN_TYPE.PULSE }),
        defaultizePin({ order: 5, type: PIN_TYPE.PULSE }),
        defaultizePin({ order: 6, type: PIN_TYPE.PULSE }),
      ]),
      0b00000001
    );
  });
  it('should determine pin number by Pin`s `order` property', () => {
    assert.equal(
      getInitialDirtyFlags([
        defaultizePin({ order: 2, type: PIN_TYPE.NUMBER }),
        defaultizePin({ order: 1, type: PIN_TYPE.BOOLEAN }),
        defaultizePin({ order: 0, type: PIN_TYPE.PULSE }),
      ]),
      0b11111101
    );
  });
});
