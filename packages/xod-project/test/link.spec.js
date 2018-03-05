import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Link from '../src/link';

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
        .to.have.keys(['@@type', 'id', 'input', 'output']);
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
      expect(Link.getLinkId({ id: '@/test' })).to.be.equal('@/test');
    });
    it('should return id string for string', () => {
      expect(Link.getLinkId('@/test')).to.be.equal('@/test');
    });
  });
  describe('getters', () => {
    const link = {
      id: '1',
      output: { pinKey: 'fromPin', nodeId: '@/from' },
      input: { pinKey: 'toPin', nodeId: '@/to' },
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
    describe('getLinkNodeIds', () => {
      it('should return Array with nodeIds: [output, input]', () => {
        const result = Link.getLinkNodeIds(link);
        expect(result).to.be.deep.equal(['@/from', '@/to']);
      });
    });
  });
  // Checks
  describe('isLinkInputNodeIdEquals', () => {
    const link = {
      id: '1',
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      expect(
        Link.isLinkInputNodeIdEquals('@/non-existent', link)
      ).to.be.false();
    });
    it('should return false for nodeId from output', () => {
      expect(
        Link.isLinkInputNodeIdEquals(link.output.nodeId, link)
      ).to.be.false();
    });
    it('should return true for nodeId from input', () => {
      expect(
        Link.isLinkInputNodeIdEquals(link.input.nodeId, link)
      ).to.be.true();
    });
  });
  describe('isLinkOutputNodeIdEquals', () => {
    const link = {
      id: '1',
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      expect(
        Link.isLinkOutputNodeIdEquals('@/non-existent', link)
      ).to.be.false();
    });
    it('should return false for nodeId from input', () => {
      expect(
        Link.isLinkOutputNodeIdEquals(link.input.nodeId, link)
      ).to.be.false();
    });
    it('should return true for nodeId from output', () => {
      expect(
        Link.isLinkOutputNodeIdEquals(link.output.nodeId, link)
      ).to.be.true();
    });
  });
  describe('isLinkInputPinKeyEquals', () => {
    const link = {
      id: '1',
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      expect(
        Link.isLinkInputPinKeyEquals('non-existent-pin', link)
      ).to.be.false();
    });
    it('should return false for pinKey from output', () => {
      expect(
        Link.isLinkInputPinKeyEquals(link.output.pinKey, link)
      ).to.be.false();
    });
    it('should return true for pinKey from input', () => {
      expect(
        Link.isLinkInputPinKeyEquals(link.input.pinKey, link)
      ).to.be.true();
    });
  });
  describe('isLinkOutputPinKeyEquals', () => {
    const link = {
      id: '1',
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      expect(
        Link.isLinkOutputPinKeyEquals('non-existent-pin', link)
      ).to.be.false();
    });
    it('should return false for pinKey from input', () => {
      expect(
        Link.isLinkOutputPinKeyEquals(link.input.pinKey, link)
      ).to.be.false();
    });
    it('should return true for pinKey from output', () => {
      expect(
        Link.isLinkOutputPinKeyEquals(link.output.pinKey, link)
      ).to.be.true();
    });
  });
});
