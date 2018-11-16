import path from 'path';
import { assert } from 'chai';
import { readFile, emptyDir, statSync } from 'fs-extra';

import { COMPILATION_ERRORS } from '../src/constants';
import { compile, saveCompiledBinary } from '../src/cloudCompiler';

const tmpDir = path.resolve(__dirname, '.tmp');
const workspacePath = subpath =>
  path.resolve(__dirname, '../../../workspace/', subpath);

const clearTmp = () => emptyDir(tmpDir);

describe('Cloud compiler', () => {
  const hexRegExp = /^(:[0-9A-F]+\s)+$/gm;
  let code = '';

  before(() =>
    Promise.all([
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
      assert.isOk(hexRegExp.test(data.data));
    }));
  it('saves compiled hex code correctly', () =>
    compile('uno', code)
      .then(saveCompiledBinary(tmpDir))
      .then(filename => {
        // Check filesize
        assert.isAbove(statSync(filename).size, 4000);
        return filename;
      })
      .then(filename => readFile(filename))
      .then(data => {
        assert.isOk(hexRegExp.test(data.toString('utf8')));
      }));
  it('returns compilation rejected error', () =>
    compile('uno', 'void()').catch(err =>
      assert.equal(err.errorCode, COMPILATION_ERRORS.COMPILE_REJECTED)
    ));
  it('returns compilation failed error', () =>
    compile('uno', `!${code}`).catch(err =>
      assert.equal(err.errorCode, COMPILATION_ERRORS.COMPILE_FAILED)
    ));
});
