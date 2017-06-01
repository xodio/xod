import fs from 'fs';
import path from 'path';
import R from 'ramda';
import { assert } from 'chai';

import { explode } from 'xod-func-tools';
import { loadProject } from 'xod-fs';
import transpile from '../src/transpiler';

// Returns patch relative to repo’s `workspace` subdir
const wsPath = (...subpath) => path.resolve(__dirname, '../../../workspace', ...subpath);

const testFixture = (projName) => {
  const expectedCpp = fs.readFileSync(wsPath(projName, '__fixtures__/arduino.cpp'), 'utf-8');
  return loadProject(wsPath(projName))
    .then(transpile(R.__, '@/main'))
    .then(explode)
    .then(cpp =>
      assert.strictEqual(cpp, expectedCpp, 'expected and actual C++ don’t match')
    );
};

describe('xod-arduino transpiler', () => {
  describe('correctly transpiles workspace fixture', () => {
    specify('blink', () => testFixture('blink'));
    specify('two-button-switch', () => testFixture('two-button-switch'));
    specify('lcd-time', () => testFixture('lcd-time'));
  });

  it('returns error for non-existing-patch entry point',
    () =>
      loadProject(wsPath('blink'))
        .then(transpile(R.__, '@/non-existing-patch'))
        .then(result => assert.ok(result.isLeft))
  );
});
