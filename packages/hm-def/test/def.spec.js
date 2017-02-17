
import R from 'ramda';
import $ from 'sanctuary-def';
import { assert } from 'chai';
import HMD from '../src/index';

const def = HMD.create({ checkTypes: true, env: $.env });

describe('def', () => {
  it('should work with unary functions', () => {
    const foo = def(
      'foo :: Number -> String',
      x => x.toString()
    );

    assert.strictEqual(foo(42), '42');
    assert.throws(() => foo(null), 'The value at position 1 is not a member of ‘Number’');
  });

  it('should work with thunks', () => {
    const foo = def(
      'foo :: () -> Number',
      () => 42
    );

    assert.strictEqual(foo(), 42);
  });
});
