import { assert } from 'chai';

import { enquote, unquote } from '../src/strings';

describe('String', () => {
  describe('quote', () => {
    it('return String wrapped with double quotes', () => {
      assert.strictEqual(enquote(''), '""');
      assert.strictEqual(enquote('Hello'), '"Hello"');
      assert.strictEqual(enquote('"Hello"'), '""Hello""');
    });
    it('return String unwrapped from double quotes', () => {
      assert.strictEqual(unquote(''), '');
      assert.strictEqual(unquote('""'), '');
      assert.strictEqual(unquote('"Hello"'), 'Hello');
      assert.strictEqual(unquote('""Hello""'), '"Hello"');
      assert.strictEqual(unquote('Hello'), 'Hello');
    });
  });
});
