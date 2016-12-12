import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Link from '../src/link';
import * as CONST from '../src/constants';

import * as Helper from './helpers';

chai.use(dirtyChai);

describe('Link', () => {
  // constructors
  describe('createLink', () => {
    const to = {
      pin: 'toPin',
      nodeId: '@/toNode',
      node: '@/toNode', // we can pass a id string
    };
    const from = {
      pin: 'fromPin',
      nodeId: '@/fromNode',
      node: { id: '@/fromNode' }, // or a whole Node object
    };
    const newLink = Link.createLink(to.pin, to.node, from.pin, from.node);

    it('should return created link with `id` and `pins` keys', () => {
      expect(newLink)
        .to.be.an('object')
        .to.have.keys(['id', 'input', 'output']);
    });
    it('should have `input` and `output` objects with keys `pinKey` and `nodeId`', () => {
      expect(newLink)
        .to.have.property('input')
        .that.have.keys(['pinKey', 'nodeId']);
      expect(newLink)
        .to.have.property('output')
        .that.have.keys(['pinKey', 'nodeId']);

      expect(newLink.output.pinKey).to.be.equal(from.pin);
      expect(newLink.output.nodeId).to.be.equal(from.nodeId);
      expect(newLink.input.pinKey).to.be.equal(to.pin);
      expect(newLink.input.nodeId).to.be.equal(to.nodeId);
    });
  });
  // properties
  describe('getLinkId', () => {
    it('should return id string for Node object', () => {
      expect(Link.getLinkId({ id: '@/test' }))
        .to.be.equal('@/test');
    });
    it('should return id string for string', () => {
      expect(Link.getLinkId('@/test'))
        .to.be.equal('@/test');
    });
  });
  describe('getters', () => {
    const link = {
      output: {
        pinKey: 'fromPin',
        nodeId: '@/from',
      },
      input: {
        pinKey: 'toPin',
        nodeId: '@/to',
      },
    };

    describe('getLinkInputNodeId', () => {
      it('should return input node id', () => {
        const result = Link.getLinkInputNodeId(link);
        expect(result).to.be.equal(link.input.nodeId);
      });
    });
    describe('getLinkOutputNodeId', () => {
      it('should return output node id', () => {
        const result = Link.getLinkOutputNodeId(link);
        expect(result).to.be.equal(link.output.nodeId);
      });
    });
    describe('getLinkInputPinKey', () => {
      it('should return input pin key', () => {
        const result = Link.getLinkInputPinKey(link);
        expect(result).to.be.equal(link.input.pinKey);
      });
    });
    describe('getLinkOutputPinKey', () => {
      it('should return output pin key', () => {
        const result = Link.getLinkOutputPinKey(link);
        expect(result).to.be.equal(link.output.pinKey);
      });
    });
  });
  // Checks
  describe('isInputNodeIdEqualsTo', () => {
    const link = {
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      expect(Link.isInputNodeIdEqualsTo('@/non-existent', link)).to.be.false();
    });
    it('should return false for nodeId from output', () => {
      expect(Link.isInputNodeIdEqualsTo(link.output.nodeId, link)).to.be.false();
    });
    it('should return true for nodeId from input', () => {
      expect(Link.isInputNodeIdEqualsTo(link.input.nodeId, link)).to.be.true();
    });
  });
  describe('isOutputNodeIdEqualsTo', () => {
    const link = {
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      expect(Link.isOutputNodeIdEqualsTo('@/non-existent', link)).to.be.false();
    });
    it('should return false for nodeId from input', () => {
      expect(Link.isOutputNodeIdEqualsTo(link.input.nodeId, link)).to.be.false();
    });
    it('should return true for nodeId from output', () => {
      expect(Link.isOutputNodeIdEqualsTo(link.output.nodeId, link)).to.be.true();
    });
  });
  describe('isInputPinKeyEqualsTo', () => {
    const link = {
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      expect(Link.isInputPinKeyEqualsTo('non-existent-pin', link)).to.be.false();
    });
    it('should return false for pinKey from output', () => {
      expect(Link.isInputPinKeyEqualsTo(link.output.pinKey, link)).to.be.false();
    });
    it('should return true for pinKey from input', () => {
      expect(Link.isInputPinKeyEqualsTo(link.input.pinKey, link)).to.be.true();
    });
  });
  describe('isOutputPinKeyEqualsTo', () => {
    const link = {
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      expect(Link.isOutputPinKeyEqualsTo('non-existent-pin', link)).to.be.false();
    });
    it('should return false for pinKey from input', () => {
      expect(Link.isOutputPinKeyEqualsTo(link.input.pinKey, link)).to.be.false();
    });
    it('should return true for pinKey from output', () => {
      expect(Link.isOutputPinKeyEqualsTo(link.output.pinKey, link)).to.be.true();
    });
  });

  describe('validateLinkId', () => {
    const link = {
      id: '1',
    };

    it('should return Either.Left for link without id', () => {
      const err = Link.validateLinkId({});
      expect(err.isLeft).to.be.true();
      console.log('wtf', err);
      Helper.expectErrorMessage(expect, err, CONST.ERROR.LINK_ID_INVALID);
    });
    it('should return Either.Right for link with id', () => {
      const newLink = Link.validateLinkId(link);
      expect(newLink.isRight).to.be.true();

      Helper.expectEither(
        val => {
          expect(val)
            .to.have.property('id')
            .that.is.a('string')
            .and.equal(link.id);
        },
        newLink
      );
    });
  });
});
