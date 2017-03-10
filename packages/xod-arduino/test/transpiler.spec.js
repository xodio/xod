import chai, { assert } from 'chai';
import chaiString from 'chai-string';

import transpile from '../src/transpiler';

import blinkProject from './fixtures/blink.project.json';
import blinkCpp from './fixtures/blink.cpp';

chai.use(chaiString);

describe('xod-arduino transpiler', () => {
  it('end to end test of blinking LED', () => {
    const r = transpile(blinkProject, '@/main');
    assert.equalIgnoreSpaces(r, blinkCpp);
  });
});
