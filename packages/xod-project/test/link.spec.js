import { assert } from 'chai';

import * as Link from '../src/link';

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
      assert.hasAllKeys(newLink, ['@@type', 'id', 'input', 'output']);
    });
    it('should have `input` and `output` objects with keys `pinKey` and `nodeId`', () => {
      assert.hasAllKeys(newLink.input, ['pinKey', 'nodeId']);
      assert.hasAllKeys(newLink.output, ['pinKey', 'nodeId']);

      assert.equal(newLink.output.pinKey, from.pin);
      assert.equal(newLink.output.nodeId, from.nodeId);
      assert.equal(newLink.input.pinKey, to.pin);
      assert.equal(newLink.input.nodeId, to.nodeId);
    });
  });
  // properties
  describe('getLinkId', () => {
    it('should return id string for Node object', () => {
      assert.equal(Link.getLinkId({ id: '@/test' }), '@/test');
    });
    it('should return id string for string', () => {
      assert.equal(Link.getLinkId('@/test'), '@/test');
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
        assert.equal(result, link.input.nodeId);
      });
    });
    describe('getLinkOutputNodeId', () => {
      it('should return output node id', () => {
        const result = Link.getLinkOutputNodeId(link);
        assert.equal(result, link.output.nodeId);
      });
    });
    describe('getLinkInputPinKey', () => {
      it('should return input pin key', () => {
        const result = Link.getLinkInputPinKey(link);
        assert.equal(result, link.input.pinKey);
      });
    });
    describe('getLinkOutputPinKey', () => {
      it('should return output pin key', () => {
        const result = Link.getLinkOutputPinKey(link);
        assert.equal(result, link.output.pinKey);
      });
    });
    describe('getLinkNodeIds', () => {
      it('should return Array with nodeIds: [output, input]', () => {
        const result = Link.getLinkNodeIds(link);
        assert.deepEqual(result, ['@/from', '@/to']);
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
      assert.isFalse(Link.isLinkInputNodeIdEquals('@/non-existent', link));
    });
    it('should return false for nodeId from output', () => {
      assert.isFalse(Link.isLinkInputNodeIdEquals(link.output.nodeId, link));
    });
    it('should return true for nodeId from input', () => {
      assert.isTrue(Link.isLinkInputNodeIdEquals(link.input.nodeId, link));
    });
  });
  describe('isLinkOutputNodeIdEquals', () => {
    const link = {
      id: '1',
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      assert.isFalse(Link.isLinkOutputNodeIdEquals('@/non-existent', link));
    });
    it('should return false for nodeId from input', () => {
      assert.isFalse(Link.isLinkOutputNodeIdEquals(link.input.nodeId, link));
    });
    it('should return true for nodeId from output', () => {
      assert.isTrue(Link.isLinkOutputNodeIdEquals(link.output.nodeId, link));
    });
  });
  describe('isLinkInputPinKeyEquals', () => {
    const link = {
      id: '1',
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      assert.isFalse(Link.isLinkInputPinKeyEquals('non-existent-pin', link));
    });
    it('should return false for pinKey from output', () => {
      assert.isFalse(Link.isLinkInputPinKeyEquals(link.output.pinKey, link));
    });
    it('should return true for pinKey from input', () => {
      assert.isTrue(Link.isLinkInputPinKeyEquals(link.input.pinKey, link));
    });
  });
  describe('isLinkOutputPinKeyEquals', () => {
    const link = {
      id: '1',
      input: { pinKey: 'toPin', nodeId: '@/to' },
      output: { pinKey: 'fromPin', nodeId: '@/from' },
    };

    it('should return false for non-existent nodeId', () => {
      assert.isFalse(Link.isLinkOutputPinKeyEquals('non-existent-pin', link));
    });
    it('should return false for pinKey from input', () => {
      assert.isFalse(Link.isLinkOutputPinKeyEquals(link.input.pinKey, link));
    });
    it('should return true for pinKey from output', () => {
      assert.isTrue(Link.isLinkOutputPinKeyEquals(link.output.pinKey, link));
    });
  });
});
