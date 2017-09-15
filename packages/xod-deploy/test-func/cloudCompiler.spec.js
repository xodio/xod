import path from 'path';
import { assert } from 'chai';
import { readFile, emptyDir } from 'fs-extra';

import { COMPILATION_ERRORS } from '../src/constants';
import { compile, saveCompiledBinary } from '../src/cloudCompiler';

const code = '#include <Arduino.h>\nvoid setup() {}\nvoid loop() {}';
const tmpDir = path.resolve(__dirname, '.tmp');
const fixture = addPath => path.resolve(__dirname, 'fixtures', addPath);

const clearTmp = () => emptyDir(tmpDir);

describe('Cloud compiler', () => {
  let compiledHex = '';
  let compiledBin = '';

  before(
    () => Promise.all([
      readFile(fixture('firmware.hex')).then((data) => { compiledHex = data.toString('utf8'); }),
      readFile(fixture('firmware.bin')).then((data) => { compiledBin = data.toString('binary'); }),
    ])
  );
  beforeEach(clearTmp);
  afterEach(clearTmp);

  it('compiles code correctly', () =>
    compile('uno', code)
      .then((data) => {
        assert.equal(data.name, 'firmware.hex');
        assert.equal(data.data, compiledHex);
      })
  );
  it('saves compiled hex code correctly', () =>
    compile('uno', code)
      .then(saveCompiledBinary(tmpDir))
      .then(filename => readFile(filename, 'binary'))
      .then(data => assert.equal(data.toString('utf8'), compiledHex))
  );
  it('saves compiled bin code correctly', () =>
    compile('due', code)
      .then(saveCompiledBinary(tmpDir))
      .then(filename => readFile(filename))
      .then(data => assert.equal(data.toString('binary'), compiledBin))
  );
  it('returns compilation error', () =>
    compile('uno', 'void()')
      .catch(err => assert.equal(
        err.errorCode,
        COMPILATION_ERRORS.COMPILE_FAILED
      ))
  );
});
