import { assert } from 'chai';
import normalizeColor from '../src/utils/normalizeColor';

describe('normalizeColorLiteral', () => {
  it('normalizes short and lower-cased notation to valid color literals', () => {
    const expectColor = (input, expected) =>
      assert.strictEqual(
        normalizeColor(input),
        expected,
        `${input} should be a ${expected}`
      );
    expectColor('#000', '#000000');
    expectColor('#fa9', '#FFAA99');
    expectColor('#DEC', '#DDEECC');
    expectColor('#fa9de8', '#FA9DE8');
    expectColor('#0CDE87', '#0CDE87');
    // Fallback to default
    expectColor('abc', '#000000');
    expectColor('#gaf', '#000000');
  });
});
