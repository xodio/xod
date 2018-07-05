import { assert } from 'chai';
import normalizeByte from '../src/utils/normalizeByte';

describe('normalizeByte', () => {
  const test = (from, to) => {
    it(`${from} -> ${to}`, () => assert.strictEqual(normalizeByte(from), to));
  };

  describe('hex', () => {
    test('2Ah', '2Ah');
    test('2ah', '2Ah');
    test('ah', '0Ah'); // always 2 digits for hex
    test('0xa', '0Ah');
    test('aaah', 'FFh'); // overflow
    test('-3h', '00h'); // underflow hex
    test('wazzaa', '00h'); // invalid input, fallback to default of type
  });
  describe('dec', () => {
    test('0', '0d');
    test('15', '15d'); // auto-add dec suffix
    test('42d', '42d');
    test('-2', '0d'); // underflow
    test('999', '255d'); // overflow
    test('-3d', '0d');
    test('5C', '00h');
    test('15abc', '00h');
  });
  describe('bin', () => {
    test('10001000b', '10001000b');
    test('0b10001000', '10001000b');
    test('1000b', '00001000b'); // always 8 digits for bin
    test('1111111111b', '11111111b'); // overflow
    test('-101b', '00000000b'); // underflow
  });
  describe('char', () => {
    test("'a'", "'a'");
    test("'\\n'", "'\\n'");
    // auto-escaping of ''' and '\'
    test("'''", "'\\''");
    test("'\\'", "'\\\\'");
    // invalid input
    test("''", '00h');
    test("'a", '00h');
    test("a'", '00h');
    test("'a'h", '00h');
    test("'too many'", '00h');
  });
});
