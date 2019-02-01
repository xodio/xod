import fs from 'fs';
import path from 'path';
import R from 'ramda';
import { assert } from 'chai';

import { explode, foldEither, explodeEither } from 'xod-func-tools';
import { loadProject } from 'xod-fs';
import {
  transpile,
  transformProject,
  getNodeIdsMap,
  commentXodPragmas,
} from '../src/transpiler';
import { LIVENESS } from '../src/constants';

// Returns patch relative to repo’s `workspace` subdir
const wsPath = (...subpath) =>
  path.resolve(__dirname, '../../../workspace', ...subpath);

describe('xod-arduino transpiler', () => {
  describe('correctly transpiles workspace fixture', () => {
    const testFixture = projName => {
      const expectedCpp = fs.readFileSync(
        wsPath(projName, '__fixtures__/arduino.cpp'),
        'utf-8'
      );

      return loadProject([wsPath()], wsPath(projName))
        .then(transformProject(R.__, '@/main', LIVENESS.NONE))
        .then(R.map(transpile))
        .then(explode)
        .then(result =>
          assert.strictEqual(
            result,
            expectedCpp,
            'expected and actual C++ don’t match'
          )
        );
    };

    specify('blink', () => testFixture('blink'));
    specify('two-button-switch', () => testFixture('two-button-switch'));
    specify('lcd-time', () => testFixture('lcd-time'));
    specify('count-with-feedback-loops', () =>
      testFixture('count-with-feedback-loops')
    );
  });

  it('returns error for non-existing-patch entry point', () =>
    loadProject([wsPath()], wsPath('blink'))
      .then(transformProject(R.__, '@/non-existing-patch', LIVENESS.NONE))
      .then(result => assert.equal(result.isLeft, true)));

  it('returns error if some native node has more than 7 outputs', () =>
    loadProject([wsPath()], wsPath('faulty'))
      .then(transformProject(R.__, '@/too-many-outputs-main', LIVENESS.NONE))
      .then(R.map(transpile))
      .then(
        foldEither(
          err => {
            assert.strictEqual(
              err.message,
              'TOO_MANY_OUTPUTS_FOR_NATIVE_NODE {"patchPath":"@/too-many-outputs"}'
            );
          },
          () => assert(false, 'expecting Either.Left')
        )
      ));

  it('sorts nodes topologically', () =>
    loadProject([wsPath()], wsPath('blink'))
      .then(
        R.pipe(
          transformProject(R.__, '@/main', LIVENESS.NONE),
          explodeEither,
          R.prop('nodes')
        )
      )
      .then(nodes => {
        const patchPaths = R.compose(R.pluck('patchPath'), R.pluck('patch'))(
          nodes
        );

        assert.deepEqual(patchPaths, [
          'xod/core/constant-boolean', // EN
          'xod/core/constant-number', // IVAL
          'xod/core/constant-port', // PORT
          'xod/core/continuously', // UPD
          'xod/core/clock',
          'xod/core/flip-flop',
          'xod/gpio/digital-write',
        ]);

        const ids = R.pluck('id', nodes);
        assert.deepEqual(
          ids,
          [0, 1, 2, 3, 4, 5, 6],
          'Node IDs were not arranged in topological order'
        );
      }));
  it('ensures definitions for all used custom types are included', () =>
    loadProject(
      [wsPath()],
      path.resolve(
        __dirname,
        './fixtures/ensure-custom-types-are-defined.xodball'
      )
    )
      .then(transformProject(R.__, '@/main', LIVENESS.NONE))
      .then(explodeEither)
      .then(tProject => {
        const actualPatchPaths = R.compose(
          R.map(R.prop('patchPath')),
          R.prop('patches')
        )(tProject);

        assert.deepEqual(actualPatchPaths, [
          // implementation of "original" type constructor was added at the top
          '@/my-type',
          '@/alternative-constructor',
          '@/cast-to-string(my-type)',
        ]);
      }));

  it('correctly sorts construction patches', () => {
    const xodball = path.resolve(
      __dirname,
      './fixtures/dependent-types.xodball'
    );

    return loadProject([wsPath()], xodball)
      .then(transformProject(R.__, '@/main', LIVENESS.NONE))
      .then(explodeEither)
      .then(tProject => {
        const actualPatchPaths = R.compose(
          R.map(R.prop('patchPath')),
          R.prop('patches')
        )(tProject);

        assert.deepEqual(actualPatchPaths, [
          '@/independent-type',
          '@/dependent-type',
          '@/dependent-on-two',
          '@/b',
          'xod/core/constant-number',
          '@/to-number',
        ]);

        // assert.strictEqual(
        //   result,
        //   expectedCpp,
        //   'expected and actual C++ don’t match'
        // )
      });
  });

  it('correctly comments XOD pragmas', () => {
    const input = [
      '      #pragma XOD blah blah',
      '      #  pragma   XOD  lala',
      '         #pragma XOD hey ho',
      '      //#pragma XOD should not be commented',
      '      #pragma XODULAR should not be commented',
      '      Serial.println("#pragma XOD should not be commented");',
    ].join('\n');
    const expected = [
      '//#pragma XOD blah blah',
      '//#pragma XOD  lala',
      '//#pragma XOD hey ho',
      '      //#pragma XOD should not be commented',
      '      #pragma XODULAR should not be commented',
      '      Serial.println("#pragma XOD should not be commented");',
    ].join('\n');
    const result = commentXodPragmas(input);
    assert.strictEqual(result, expected);
  });
});

describe('getNodeIdsMap', () => {
  it('should return correct NodeIdsMap', () => {
    const expected = {
      By6HVYHZb: '4',
      rkwIEFrWb: '5',
      SyeDNFBWZ: '6',
    };

    return loadProject([wsPath()], wsPath('blink'))
      .then(transformProject(R.__, '@/main', LIVENESS.NONE))
      .then(R.map(getNodeIdsMap))
      .then(explode)
      .then(result =>
        R.mapObjIndexed(
          (nodeId, origNodeId) =>
            assert.propertyVal(result, origNodeId, nodeId),
          expected
        )
      );
  });
});
