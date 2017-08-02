import fs from 'fs';
import path from 'path';
import R from 'ramda';
import { assert } from 'chai';

import { explode } from 'xod-func-tools';
import { loadProject } from 'xod-fs';
import { PIN_TYPE } from 'xod-project';
import { defaultizePin } from 'xod-project/test/helpers';
import transpile, { getInitialDirtyFlags } from '../src/transpiler';

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
