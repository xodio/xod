import fs from 'fs-extra';
import path from 'path';
import { assert } from 'chai';
import { exec } from 'child-process-promise';

import { rmrf } from 'xod-fs';

const tmpPath = subpath => path.resolve(__dirname, './tmp', subpath);
const xodc = path.resolve(__dirname, '../bin/xodc');
const wsPath = subpath =>
  path.resolve(__dirname, '../../../workspace', subpath);

describe('xodc transpile', () => {
  afterEach(() => rmrf(tmpPath('./')));

  it('should transpile Blink project for Arduino', () =>
    exec(
      `node ${xodc} transpile --output=${tmpPath('blink.cpp')} ${wsPath(
        'blink'
      )} @/main`
    )
      .then(() =>
        Promise.all([
          fs.readFile(tmpPath('blink.cpp'), 'utf-8'),
          fs.readFile(wsPath('blink/__fixtures__/arduino.cpp'), 'utf-8'),
        ])
      )
      .then(([actual, expected]) =>
        assert.strictEqual(
          actual,
          expected,
          'expected and actual C++ don’t match'
        )
      ));
});
