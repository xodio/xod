import { assert } from 'chai';

import * as Node from '../src/node';
import * as CONST from '../src/constants';

import * as Helper from './helpers';

const emptyNode = Helper.defaultizeNode({});

const nodeOfType = type => Helper.defaultizeNode({ type });

describe('Node', () => {
  // constructors
  describe('duplicateNode', () => {
    const node = Helper.defaultizeNode({
      id: 'test',
      position: { x: 0, y: 0 },
      type: '@/test',
    });
    const newNode = Node.duplicateNode(node);

    it('should return node object with same properties but new id', () => {
      assert.notEqual(newNode.id, node.id);
      assert.deepEqual(newNode.position, node.position);
      assert.deepEqual(newNode.type, node.type);
    });
    it('should return copy of node always with new id', () => {
      const newNode1 = Node.duplicateNode(node);
      const newNode2 = Node.duplicateNode(node);
      const newNode3 = Node.duplicateNode(node);
      const newNode4 = Node.duplicateNode(node);

      assert.notEqual(newNode1.id, newNode2.id);
      assert.notEqual(newNode2.id, newNode3.id);
      assert.notEqual(newNode3.id, newNode4.id);
    });
    it('should return not the same object', () => {
      assert.notEqual(newNode, node);
    });
  });
  // properties
  describe('getNodeId', () => {
    it('should return id string for Node object', () => {
      assert.equal(Node.getNodeId({ id: '@/test' }), '@/test');
    });
    it('should return id string for string', () => {
      assert.equal(Node.getNodeId('@/test'), '@/test');
    });
  });
  describe('getNodeType', () => {
    it('should return type', () => {
      assert.equal(Node.getNodeType(nodeOfType('@/test')), '@/test');
    });
  });
  describe('setNodeType', () => {
    it('should return node with new type', () => {
      const node = nodeOfType('@/test');
      const newNode = Node.setNodeType('@/test-passed', node);

      assert.equal(Node.getNodeType(newNode), '@/test-passed');
    });
  });
  describe('getNodePosition', () => {
    it('should return node position', () => {
      const node = Helper.defaultizeNode({ position: { x: 1, y: 1 } });
      assert.hasAllKeys(Node.getNodePosition(node), ['x', 'y']);
    });
  });
  describe('setNodePosition', () => {
    it('should return node in new position', () => {
      const node = Helper.defaultizeNode({ position: { x: 1, y: 1 } });
      const newNode = Node.setNodePosition({ x: 10, y: 10 }, node);

      assert.deepEqual(Node.getNodePosition(newNode), { x: 10, y: 10 });
    });
  });
  describe('getNodeLabel', () => {
    it('should return node label', () => {
      const node = Helper.defaultizeNode({ label: 'nodeLabel' });
      assert.equal(Node.getNodeLabel(node), 'nodeLabel');
    });
  });
  describe('setNodeLabel', () => {
    it('should return Node with new label', () => {
      const label = 'new label';
      const newNode = Node.setNodeLabel(label, emptyNode);

      assert.equal(Node.getNodeLabel(newNode), label);
    });
  });

  describe('getAllBoundValues', () => {
    it('should return empty object for node without bound values', () => {
      const node = Helper.defaultizeNode({ boundLiterals: {} });
      assert.isEmpty(Node.getAllBoundValues(node));
    });
    it('should return object with shape { pinKey: pinValue }', () => {
      const node = Helper.defaultizeNode({
        boundLiterals: {
          a: true,
          b: 10,
        },
      });

      assert.deepEqual(Node.getAllBoundValues(node), {
        a: true,
        b: 10,
      });
    });
  });

  describe('getBoundValue', () => {
    const node = Helper.defaultizeNode({
      boundLiterals: {
        existing: 'hey-ho',
      },
    });
    const checkJust = pinName => {
      const value = Node.getBoundValue(pinName, node);
      assert.isTrue(value.isJust);
      assert.equal(value.getOrElse(null), node.boundLiterals[pinName]);
    };

    it('should return Maybe.Nothing for undefined value', () => {
      const value = Node.getBoundValue('non-existent', node);
      assert.isTrue(value.isNothing);
    });
    it('should return Maybe.Just for defined bound value of a pin', () => {
      const pinName = 'existing';
      checkJust(pinName);
    });
  });
  describe('setBoundValue', () => {
    it('should return Node with new bound pin value', () => {
      const newNode = Node.setBoundValue('test', true, emptyNode);

      Helper.expectMaybeJust(Node.getBoundValue('test', newNode), true);
    });
    it('should return Node with replaced bound value', () => {
      const node = Helper.defaultizeNode({
        boundLiterals: {
          test: false,
        },
      });

      const newNode = Node.setBoundValue('test', true, node);

      Helper.expectMaybeJust(Node.getBoundValue('test', newNode), true);
    });
    it('should return Node without affecting other bound values', () => {
      const node = Helper.defaultizeNode({
        boundLiterals: {
          other: false,
        },
      });

      const newNode = Node.setBoundValue('test', true, node);
      Helper.expectMaybeJust(Node.getBoundValue('other', newNode), false);
    });
  });
  // checks
  describe('isInputPinNode', () => {
    it('should return false for type not equal to xod/patch-nodes/input-*', () => {
      assert.isFalse(Node.isInputPinNode(nodeOfType('@/input')));
    });
    it('should return true for type equal to xod/patch-nodes/input-*', () => {
      assert.isTrue(
        Node.isInputPinNode(nodeOfType('xod/patch-nodes/input-number'))
      );
    });
  });
  describe('isOutputPinNode', () => {
    it('should return false for type not equal to xod/patch-nodes/output-*', () => {
      assert.isFalse(Node.isOutputPinNode(nodeOfType('test/test/output')));
    });
    it('should return true for type equal to xod/patch-nodes/output-*', () => {
      assert.isTrue(
        Node.isOutputPinNode(nodeOfType('xod/patch-nodes/output-number'))
      );
    });
  });
  describe('isPinNode', () => {
    it('should return false for type not equal to xod/patch-nodes/input-* or xod/patch-nodes/output-*', () => {
      assert.isFalse(Node.isPinNode(nodeOfType('test/test/output')));
    });
    it('should return true for type equal to xod/patch-nodes/input*', () => {
      assert.isTrue(Node.isPinNode(nodeOfType('xod/patch-nodes/input-number')));
    });
    it('should return true for type equal to xod/patch-nodes/output*', () => {
      assert.isTrue(
        Node.isPinNode(nodeOfType('xod/patch-nodes/output-number'))
      );
    });
  });
  // etc
  describe('getPinNodeDataType', () => {
    it('should return `number` for xod/patch-nodes/input-number', () => {
      const res = Node.getPinNodeDataType(
        nodeOfType('xod/patch-nodes/input-number')
      );
      assert.equal(res, CONST.PIN_TYPE.NUMBER);
    });
    it('should return `number` for xod/patch-nodes/output-number', () => {
      const res = Node.getPinNodeDataType(
        nodeOfType('xod/patch-nodes/input-number')
      );
      assert.equal(res, CONST.PIN_TYPE.NUMBER);
    });
  });
  describe('getPinNodeDirection', () => {
    it('should return `input` for `xod/patch-nodes/input-number`', () => {
      const res = Node.getPinNodeDirection(
        nodeOfType('xod/patch-nodes/input-number')
      );
      assert.equal(res, 'input');
    });
    it('should return `output` for `xod/patch-nodes/output-number`', () => {
      const res = Node.getPinNodeDirection(
        nodeOfType('xod/patch-nodes/output-number')
      );
      assert.equal(res, 'output');
    });
  });
});
