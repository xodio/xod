import * as R from 'ramda';
import { assert } from 'chai';

import path from 'path';
import { generatePatchSuite } from 'xod-tabtest';
import { eitherToPromise } from 'xod-func-tools';
import { loadProject } from 'xod-fs';

import { compileSuite, runSuite } from '../src';

describe('end-to-end test', () => {
  it('compiles and runs tabtest for xod/bits/bcd-to-dec', () =>
    loadProject(
      [path.resolve(__dirname, '../../../workspace')],
      path.resolve(__dirname, '../../../workspace/__lib__/xod/bits')
    )
      .then(
        R.compose(eitherToPromise, project =>
          generatePatchSuite(project, '@/bcd-to-dec')
        )
      )
      .then(compileSuite('xod.io'))
      .then(
        R.tap(compiledSuite => {
          assert.isObject(compiledSuite.options);
          assert.isString(compiledSuite.artifacts.wasmBinary);
        })
      )
      .then(runSuite)
      .then(({ stdout, stderr }) => {
        assert.deepEqual(stderr, []);
        assert.deepEqual(stdout, [
          '===============================================================================',
          'All tests passed (5 assertions in 1 test case)',
          '',
        ]);
      }));
});
