import R from 'ramda';
import chai, { expect, assert } from 'chai';
import dirtyChai from 'dirty-chai';
import shortid from 'shortid';

import * as Utils from '../src/utils';

chai.use(dirtyChai);

// Kludge to overwrite corrupted by dirtyChai asserts
// TODO: Remove dirtyChai ( https://github.com/xodio/xod/issues/1129 )
assert.isTrue = a => assert.equal(a, true);
assert.isFalse = a => assert.equal(a, false);

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
      expect(Utils.guidToIdx({}))
        .to.be.an('object')
        .and.to.be.empty();
    });
    it('guidToIdx: should return a map oldId to newId', () => {
      expect(Utils.guidToIdx(nodes)).to.be.deep.equal({
        a: '0',
        b: '1',
        c: '2',
      });
    });

    it('resolveNodeIds: should return nodes with new ids', () => {
      expect(Utils.resolveNodeIds(nodesIdMap, nodes)).to.be.deep.equal(
        expectedNodes
      );
    });
    it('resolveLinkNodeIds: should return links with resolved node ids', () => {
      expect(Utils.resolveLinkNodeIds(nodesIdMap, links)).to.be.deep.equal(
        expectedLinks
      );
    });
  });

  // etc
  describe('generateId', () => {
    it('should be valid shortid', () => {
      const id = Utils.generateId();
      expect(shortid.isValid(id)).to.be.true();
    });
    it('should return new ids each time', () => {
      const ids = R.uniq(R.times(Utils.generateId, 5));
      expect(ids).to.have.lengthOf(5);
    });
  });
  describe('validateId', () => {
    it('should return false for invalid id', () => {
      const id = 'i have spaces и немного кириллицы';
      expect(shortid.isValid(id)).to.be.false();
    });
    it('should be valid shortid', () => {
      const id = '123aBc';
      expect(shortid.isValid(id)).to.be.true();
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
});
