import R from 'ramda';
import { assert } from 'chai';
import shortid from 'shortid';

import * as Utils from '../src/utils';
import { PIN_TYPE } from '../src/constants';
import * as Helpers from './helpers';

describe('Utils', () => {
  // transforming node ids
  describe('renumering of nodeIds', () => {
    const nodes = [
      { id: 'a', was: 'a' },
      { id: 'b', was: 'b' },
      { id: 'c', was: 'c' },
    ];
    const links = [
      { id: 'x', input: { nodeId: 'b' }, output: { nodeId: 'a' } },
      { id: 'y', input: { nodeId: 'c' }, output: { nodeId: 'b' } },
    ];
    const nodesIdMap = Utils.guidToIdx(nodes);

    const expectedNodes = [
      { id: '0', was: 'a' },
      { id: '1', was: 'b' },
      { id: '2', was: 'c' },
    ];
    const expectedLinks = [
      { id: 'x', input: { nodeId: '1' }, output: { nodeId: '0' } },
      { id: 'y', input: { nodeId: '2' }, output: { nodeId: '1' } },
    ];

    it('guidToIdx: should return an empty map for empty nodes', () => {
      assert.deepEqual(Utils.guidToIdx({}), {});
    });
    it('guidToIdx: should return a map oldId to newId', () => {
      assert.deepEqual(Utils.guidToIdx(nodes), {
        a: '0',
        b: '1',
        c: '2',
      });
    });

    it('resolveNodeIds: should return nodes with new ids', () => {
      assert.deepEqual(Utils.resolveNodeIds(nodesIdMap, nodes), expectedNodes);
    });
    it('resolveLinkNodeIds: should return links with resolved node ids', () => {
      assert.deepEqual(
        Utils.resolveLinkNodeIds(nodesIdMap, links),
        expectedLinks
      );
    });
  });

  // etc
  describe('generateId', () => {
    it('should be valid shortid', () => {
      const id = Utils.generateId();
      assert.isTrue(shortid.isValid(id));
    });
    it('should return new ids each time', () => {
      const ids = R.uniq(R.times(Utils.generateId, 5));
      assert.lengthOf(ids, 5);
    });
  });
  describe('validateId', () => {
    it('should return false for invalid id', () => {
      const id = 'i have spaces и немного кириллицы';
      assert.isFalse(shortid.isValid(id));
    });
    it('should be valid shortid', () => {
      const id = '123aBc';
      assert.isTrue(shortid.isValid(id));
    });
  });
  describe('isValidNumberDataValue', () => {
    it('valid simple numbers', () => {
      assert.isTrue(Utils.isValidNumberDataValue('3'));
      assert.isTrue(Utils.isValidNumberDataValue('0.2'));
      assert.isTrue(Utils.isValidNumberDataValue('+35.156'));
      assert.isTrue(Utils.isValidNumberDataValue('-3'));
      assert.isTrue(Utils.isValidNumberDataValue('-6.46'));
    });
    it('valid floats with leading decimal point', () => {
      assert.isTrue(Utils.isValidNumberDataValue('.2'));
      assert.isTrue(Utils.isValidNumberDataValue('+.52'));
      assert.isTrue(Utils.isValidNumberDataValue('-.465'));
    });
    it('valid floats with trailing decimal point', () => {
      assert.isTrue(Utils.isValidNumberDataValue('3.'));
      assert.isTrue(Utils.isValidNumberDataValue('+13.'));
      assert.isTrue(Utils.isValidNumberDataValue('-141.'));
    });
    it('valid with scientific notation', () => {
      assert.isTrue(Utils.isValidNumberDataValue('5e3'));
      assert.isTrue(Utils.isValidNumberDataValue('+3e-4'));
      assert.isTrue(Utils.isValidNumberDataValue('-2e-12'));
      assert.isTrue(Utils.isValidNumberDataValue('.25e-1'));
      assert.isTrue(Utils.isValidNumberDataValue('3.e5'));
    });
    it('valid Not a Number value', () => {
      assert.isTrue(Utils.isValidNumberDataValue('NaN'));
    });
    it('valid Infinity numbers', () => {
      assert.isTrue(Utils.isValidNumberDataValue('Inf'));
      assert.isTrue(Utils.isValidNumberDataValue('+Inf'));
      assert.isTrue(Utils.isValidNumberDataValue('-Inf'));
    });
    it('invalid values', () => {
      assert.isFalse(Utils.isValidNumberDataValue('asdas'));
      assert.isFalse(Utils.isValidNumberDataValue('.'));
      assert.isFalse(Utils.isValidNumberDataValue('..5'));
      assert.isFalse(Utils.isValidNumberDataValue('5..'));
      assert.isFalse(Utils.isValidNumberDataValue('0.3.e6'));
      assert.isFalse(Utils.isValidNumberDataValue('3e5.3'));
      assert.isFalse(Utils.isValidNumberDataValue('5..e6'));
      assert.isFalse(Utils.isValidNumberDataValue('e5'));
      assert.isFalse(Utils.isValidNumberDataValue('.e5'));
      assert.isFalse(Utils.isValidNumberDataValue('-+56.3'));
      assert.isFalse(Utils.isValidNumberDataValue('--35'));
    });
  });

  describe('getTypeFromLiteral', () => {
    const expectType = (literal, expectedType) =>
      R.compose(
        Helpers.expectEitherRight(actualType =>
          assert.strictEqual(
            actualType,
            expectedType,
            `${literal} should be a ${expectedType}`
          )
        ),
        Utils.getTypeFromLiteral
      )(literal);

    it('should recognise string literals', () => {
      expectType('""', PIN_TYPE.STRING);
      expectType('"Hello there"', PIN_TYPE.STRING);
    });

    it('should recognise number literals', () => {
      expectType('0', PIN_TYPE.NUMBER);
      expectType('111', PIN_TYPE.NUMBER);
      expectType('123.45', PIN_TYPE.NUMBER);
      expectType('-50.5', PIN_TYPE.NUMBER);
      expectType('NaN', PIN_TYPE.NUMBER);
      // test for isValidNumberDataValue covers the rest
    });

    it('should recognise boolean literals', () => {
      expectType('True', PIN_TYPE.BOOLEAN);
      expectType('False', PIN_TYPE.BOOLEAN);
    });

    it('should recognise pulse literals', () => {
      expectType('Never', PIN_TYPE.PULSE);
      expectType('Continuously', PIN_TYPE.PULSE);
      expectType('On Boot', PIN_TYPE.PULSE);
    });

    it('should recognise byte literals', () => {
      expectType('01011010b', PIN_TYPE.BYTE);
      expectType('12d', PIN_TYPE.BYTE);
      expectType('025d', PIN_TYPE.BYTE);
      expectType('255d', PIN_TYPE.BYTE);
      expectType('3Ah', PIN_TYPE.BYTE);
      expectType("'a'", PIN_TYPE.BYTE);
      expectType("'\\n'", PIN_TYPE.BYTE);
      expectType("'\\\\'", PIN_TYPE.BYTE);
      expectType("'\\''", PIN_TYPE.BYTE);
    });

    it('should recognise port literals', () => {
      expectType('A0', PIN_TYPE.PORT);
      expectType('A13', PIN_TYPE.PORT);
      expectType('D0', PIN_TYPE.PORT);
      expectType('D13', PIN_TYPE.PORT);
    });
  });
});
