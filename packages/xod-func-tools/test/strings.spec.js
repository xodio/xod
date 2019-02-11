import { assert } from 'chai';

import { enquote, unquote, cppEscape } from '../src/strings';

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

  describe('cppEscape', () => {
    it('should leave valid strings untouched', () => {
      assert.strictEqual(cppEscape('Hello'), 'Hello');
      assert.strictEqual(cppEscape('one_two_three'), 'one_two_three');
    });
    it('should escape non-C++ friendly characters', () => {
      assert.strictEqual(cppEscape('hello world'), 'hello_world');
      assert.strictEqual(cppEscape('a-b'), 'a_b');
      assert.strictEqual(cppEscape('wow-⏅'), 'wow_U23C5');
      assert.strictEqual(cppEscape('o_🙈'), 'o_UD83DUDE48');
      assert.strictEqual(cppEscape('awe<some!'), 'aweU003CsomeU0021');
    });
  });
});
