import fs from 'fs';
import path from 'path';
import R from 'ramda';
import { assert } from 'chai';

import { explode } from 'xod-func-tools';
import { loadProject } from 'xod-fs';
import transpile from '../src/transpiler';

const wsPath = subpath => path.resolve(__dirname, '../../../workspace', subpath);

describe('xod-arduino transpiler (end-to-end tests)', () => {
  it('Transpile Blink project with "@/main" entry-point patch should return Either.Right with C++ code', () => {
    const expectedCpp = fs.readFileSync(wsPath('blink/__fixtures__/arduino.cpp'), 'utf-8');
    return loadProject(wsPath('blink'))
      .then(transpile(R.__, '@/main'))
      .then(explode)
      .then(cpp =>
        assert.strictEqual(cpp, expectedCpp, 'expected and actual C++ don’t match')
      );
  });

  it('Transpile Blink project with a non-existing-patch as entry-point should return Either.Left with error',
    () =>
      loadProject(wsPath('blink'))
        .then(transpile(R.__, '@/non-existing-patch'))
        .then(result => assert.ok(result.isLeft))
  );
});
