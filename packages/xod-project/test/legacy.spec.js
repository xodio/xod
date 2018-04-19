import { assert } from 'chai';

import { PIN_TYPE } from '../src/constants';
import { ensureLiteral } from '../src/legacy';

describe('Legacy', () => {
  describe('ensureLiteral', () => {
    it('returns Literal for Boolean types', () => {
      // DataValue -> Literal
      assert.strictEqual(ensureLiteral(PIN_TYPE.BOOLEAN, true), 'True');
      assert.strictEqual(ensureLiteral(PIN_TYPE.BOOLEAN, false), 'False');
      // Literal -> Literal
      assert.strictEqual(ensureLiteral(PIN_TYPE.BOOLEAN, 'True'), 'True');
      assert.strictEqual(ensureLiteral(PIN_TYPE.BOOLEAN, 'False'), 'False');
    });
    it('returns Literal for Number types', () => {
      // DataValue -> Literal
      assert.strictEqual(ensureLiteral(PIN_TYPE.NUMBER, 0.312), '0.312');
      assert.strictEqual(ensureLiteral(PIN_TYPE.NUMBER, 42), '42');
      assert.strictEqual(ensureLiteral(PIN_TYPE.NUMBER, -42.15), '-42.15');
      // Literal -> Literal
      assert.strictEqual(ensureLiteral(PIN_TYPE.NUMBER, '0.312'), '0.312');
      assert.strictEqual(ensureLiteral(PIN_TYPE.NUMBER, '42'), '42');
      assert.strictEqual(ensureLiteral(PIN_TYPE.NUMBER, '-42.15'), '-42.15');
    });
    it('returns Literal for Pulse types', () => {
      // DataValue -> Literal
      // Old default value for "Never" pulse value was just `false`
      assert.strictEqual(ensureLiteral(PIN_TYPE.PULSE, false), 'Never');
      assert.strictEqual(ensureLiteral(PIN_TYPE.PULSE, 'NEVER'), 'Never');
      assert.strictEqual(
        ensureLiteral(PIN_TYPE.PULSE, 'CONTINUOUSLY'),
        'Continuously'
      );
      assert.strictEqual(ensureLiteral(PIN_TYPE.PULSE, 'ON_BOOT'), 'On Boot');
      // Literal -> Literal
      assert.strictEqual(ensureLiteral(PIN_TYPE.PULSE, 'Never'), 'Never');
      assert.strictEqual(
        ensureLiteral(PIN_TYPE.PULSE, 'Continuously'),
        'Continuously'
      );
      assert.strictEqual(ensureLiteral(PIN_TYPE.PULSE, 'On Boot'), 'On Boot');
    });
    it('returns Literal for String types', () => {
      // DataValue -> Literal
      assert.strictEqual(ensureLiteral(PIN_TYPE.STRING, ''), '""');
      assert.strictEqual(ensureLiteral(PIN_TYPE.STRING, 'Hello'), '"Hello"');
      assert.strictEqual(
        ensureLiteral(PIN_TYPE.STRING, 'And he said "Hello, World"'),
        '"And he said "Hello, World""'
      );
      assert.strictEqual(ensureLiteral(PIN_TYPE.STRING, '36.6'), '"36.6"');
      assert.strictEqual(ensureLiteral(PIN_TYPE.STRING, 'true'), '"true"');
      // Literal -> Literal
      assert.strictEqual(ensureLiteral(PIN_TYPE.STRING, '""'), '""');
      assert.strictEqual(ensureLiteral(PIN_TYPE.STRING, '"Hello"'), '"Hello"');
      assert.strictEqual(
        ensureLiteral(PIN_TYPE.STRING, '"And he said "Hello, World""'),
        '"And he said "Hello, World""'
      );
      assert.strictEqual(ensureLiteral(PIN_TYPE.STRING, '"36.6"'), '"36.6"');
      assert.strictEqual(ensureLiteral(PIN_TYPE.STRING, '"true"'), '"true"');
    });
    it('throws an Error for unknown type', () => {
      assert.throws(
        // DEAD type used, to avoid error throwing by hm-def
        // Also, DEAD pin could not have a bound value, cause it created
        // by a dead link to unexisting Pin.
        () => ensureLiteral(PIN_TYPE.DEAD, '732'),
        `Can't ensure Literal for unknown type "dead" (value: "732")`
      );
    });
  });
});
