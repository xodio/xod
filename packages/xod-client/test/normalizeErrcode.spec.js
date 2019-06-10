import { assert } from 'chai';
import normalizeErrcode from '../src/utils/normalizeErrcode';

describe('normalizeErrcode', () => {
  const test = (from, to) => {
    it(`${from} -> ${to}`, () =>
      assert.strictEqual(normalizeErrcode(from), to));
  };

  test('complete gibberish', 'E0');
  test('z42', 'E0');

  describe('ensure there is an uppercase leading E', () => {
    test('42', 'E42'); // insert leading 'E'
    test('e42', 'E42'); // uppercase leading 'E'
  });

  describe('ensure that code is an integer', () => {
    test('E09', 'E9');
    test('E009', 'E9');
    test('E42.5', 'E42');
    test('E42,5', 'E42');
  });

  describe('ensure boundaries', () => {
    test('E256', 'E255');
    test('E-1', 'E0');
  });

  describe('preserve correct values', () => {
    test('E0', 'E0');
    test('E42', 'E42');
    test('E127', 'E127');
    test('E255', 'E255');
  });
});
