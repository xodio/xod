import { assert } from 'chai';
import transpiler from '../src/transpiler';

describe('xod-arduino', () => {
  it('package is correctly configured', () => {
    assert.isTrue(transpiler());
  });
});
