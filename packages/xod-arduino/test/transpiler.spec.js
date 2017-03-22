import chai, { assert } from 'chai';
import chaiString from 'chai-string';

import { explode } from 'xod-func-tools';
import transpile from '../src/transpiler';

import blinkProject from './fixtures/blink.project.json';
import blinkCpp from './fixtures/blink.cpp';

chai.use(chaiString);

describe('xod-arduino transpiler (end-to-end test)', () => {
  it('should return Either.Right with C++ code', () => {
    const r = transpile(blinkProject, '@/main');
    const cpp = explode(r);
    assert.equal(r.isRight, true);
    assert.equalIgnoreSpaces(cpp, blinkCpp);
  });
  it('should return Either.Left with error if entry-point patch not found', () => {
    const r = transpile(blinkProject, '@/non-existing-patch');
    assert.equal(r.isLeft, true);
  });
});
