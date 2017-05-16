import R from 'ramda';
import chai, { expect, assert } from 'chai';
import dirtyChai from 'dirty-chai';
import shortid from 'shortid';

import * as Utils from '../src/utils';
import { PIN_TYPE } from '../src/constants';

chai.use(dirtyChai);

describe('Utils', () => {
  describe('canCastTypes constrains', () => {
    const types = R.values(PIN_TYPE);

    describe('pulse', () => {
      const otherTypes = R.reject(R.equals(PIN_TYPE.PULSE), types);

      it('cannot be casted to any other type', () => {
        otherTypes.forEach(
          type => assert.isFalse(
            Utils.canCastTypes(PIN_TYPE.PULSE, type),
            `should not be castable to ${type}`
          )
        );
      });
      it('cannot be casted from any other type', () => {
        otherTypes.forEach(
          type => assert.isFalse(
            Utils.canCastTypes(type, PIN_TYPE.PULSE),
            `should not be castable from ${type}`
          )
        );
      });
    });

    describe('string', () => {
      const otherTypes = R.reject(R.equals(PIN_TYPE.STRING), types);

      it('cannot be casted to any other type', () => {
        otherTypes.forEach(
          type => assert.isFalse(
            Utils.canCastTypes(PIN_TYPE.STRING, type),
            `should not be castable to ${type}`
          )
        );
      });
      it('can be casted from any other type, except pulse', () => {
        R.reject(R.equals(PIN_TYPE.PULSE), otherTypes).forEach(
          type => assert.isTrue(
            Utils.canCastTypes(type, PIN_TYPE.STRING),
            `should be castable from ${type}`
          )
        );
      });
    });
  });

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
      expect(Utils.guidToIdx(nodes))
        .to.be.deep.equal({
          a: '0',
          b: '1',
          c: '2',
        });
    });

    it('resolveNodeIds: should return nodes with new ids', () => {
      expect(Utils.resolveNodeIds(nodesIdMap, nodes))
        .to.be.deep.equal(expectedNodes);
    });
    it('resolveLinkNodeIds: should return links with resolved node ids', () => {
      expect(Utils.resolveLinkNodeIds(nodesIdMap, links))
        .to.be.deep.equal(expectedLinks);
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
});
