import path from 'path';
import { assert } from 'chai';
import { readFile, emptyDir } from 'fs-extra';

import { COMPILATION_ERRORS } from '../src/constants';
import { compile, saveCompiledBinary } from '../src/cloudCompiler';

const tmpDir = path.resolve(__dirname, '.tmp');
const workspacePath = subpath =>
  path.resolve(__dirname, '../../../workspace/', subpath);

const clearTmp = () => emptyDir(tmpDir);

describe('Cloud compiler', () => {
  let compiledHex = '';
  let compiledBin = '';
  let code = '';

  before(() =>
    Promise.all([
      readFile(workspacePath('blink/__fixtures__/firmware.hex')).then(data => {
        compiledHex = data.toString('utf8');
      }),
      readFile(workspacePath('blink/__fixtures__/firmware.bin')).then(data => {
        compiledBin = data.toString('binary');
      }),
      readFile(workspacePath('blink/__fixtures__/arduino.cpp')).then(data => {
        code = data.toString('utf8');
      }),
    ])
  );
  beforeEach(clearTmp);
  afterEach(clearTmp);

  it('compiles code correctly', () =>
    compile('uno', code).then(data => {
      assert.equal(data.name, 'firmware.hex');
      assert.equal(data.data, compiledHex);
    }));
  it('saves compiled hex code correctly', () =>
    compile('uno', code)
      .then(saveCompiledBinary(tmpDir))
      .then(filename => readFile(filename, 'binary'))
      .then(data => assert.equal(data.toString('utf8'), compiledHex)));
  it('saves compiled bin code correctly', () =>
    compile('due', code)
      .then(saveCompiledBinary(tmpDir))
      .then(filename => readFile(filename))
      .then(data => assert.equal(data.toString('binary'), compiledBin)));
  it('returns compilation rejected error', () =>
    compile('uno', 'void()').catch(err =>
      assert.equal(err.errorCode, COMPILATION_ERRORS.COMPILE_REJECTED)
    ));
  it('returns compilation failed error', () =>
    compile('uno', `!${code}`).catch(err =>
      assert.equal(err.errorCode, COMPILATION_ERRORS.COMPILE_FAILED)
    ));
});
