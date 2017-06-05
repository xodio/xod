import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Node from '../src/node';
import * as CONST from '../src/constants';

import * as Helper from './helpers';

chai.use(dirtyChai);

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
      expect(newNode.id).not.equals(node.id);
      expect(newNode.position).deep.equal(node.position);
      expect(newNode.type).deep.equal(node.type);
    });
    it('should return copy of node always with new id', () => {
      const newNode1 = Node.duplicateNode(node);
      const newNode2 = Node.duplicateNode(node);
      const newNode3 = Node.duplicateNode(node);
      const newNode4 = Node.duplicateNode(node);

      expect(newNode1.id).not.equals(newNode2.id);
      expect(newNode2.id).not.equals(newNode3.id);
      expect(newNode3.id).not.equals(newNode4.id);
    });
    it('should return not the same object', () => {
      expect(newNode).not.equals(node);
    });
  });
  // properties
  describe('getNodeId', () => {
    it('should return id string for Node object', () => {
      expect(Node.getNodeId({ id: '@/test' }))
        .to.be.equal('@/test');
    });
    it('should return id string for string', () => {
      expect(Node.getNodeId('@/test'))
        .to.be.equal('@/test');
    });
  });
  describe('getNodeType', () => {
    it('should return type', () => {
      expect(Node.getNodeType(nodeOfType('@/test')))
        .to.be.equal('@/test');
    });
  });
  describe('setNodeType', () => {
    it('should return node with new type', () => {
      const node = nodeOfType('@/test');
      const newNode = Node.setNodeType('@/test-passed', node);

      expect(Node.getNodeType(newNode)).to.be.equal('@/test-passed');
    });
  });
  describe('getNodePosition', () => {
    it('should return node position', () => {
      const node = Helper.defaultizeNode({ position: { x: 1, y: 1 } });
      expect(Node.getNodePosition(node))
        .to.be.an('object')
        .that.have.keys(['x', 'y']);
    });
  });
  describe('setNodePosition', () => {
    it('should return node in new position', () => {
      const node = Helper.defaultizeNode({ position: { x: 1, y: 1 } });
      const newNode = Node.setNodePosition({ x: 1, y: 1 }, node);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('position');

      expect(newNode.position)
        .to.have.property('x')
        .to.be.equal(1);

      expect(newNode.position)
        .to.have.property('y')
        .to.be.equal(1);
    });
  });
  describe('getNodeLabel', () => {
    it('should return node label', () => {
      const node = Helper.defaultizeNode({ label: 'nodeLabel' });
      expect(Node.getNodeLabel(node)).to.be.equal('nodeLabel');
    });
  });
  describe('setNodeLabel', () => {
    it('should return Node with new label', () => {
      const label = 'new label';
      const newNode = Node.setNodeLabel(label, emptyNode);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('label')
        .that.equals(label);
    });
  });

  describe('getAllBoundValues', () => {
    it('should return empty object for node without bound values', () => {
      const node = Helper.defaultizeNode({ boundValues: {} });
      expect(Node.getAllBoundValues(node)).to.be.an('object').and.empty();
    });
    it('should return object with shape { pinKey: pinValue }', () => {
      const node = Helper.defaultizeNode({
        boundValues: {
          a: true,
          b: 10,
        },
      });

      expect(Node.getAllBoundValues(node)).to.be.deep.equal({
        a: true,
        b: 10,
      });
    });
  });

  describe('getBoundValue', () => {
    const node = Helper.defaultizeNode({
      boundValues: {
        existing: 'hey-ho',
      },
    });
    const checkJust = (pinName) => {
      const value = Node.getBoundValue(pinName, node);
      expect(value.isJust).to.be.true();
      expect(value.getOrElse(null)).to.be.equal(node.boundValues[pinName]);
    };

    it('should return Maybe.Nothing for undefined value', () => {
      const value = Node.getBoundValue('non-existent', node);
      expect(value.isNothing).to.be.true();
    });
    it('should return Maybe.Just for defined bound value of a pin', () => {
      const pinName = 'existing';
      checkJust(pinName);
    });
  });
  describe('setBoundValue', () => {
    it('should return Node with new bound pin value', () => {
      const newNode = Node.setBoundValue('test', true, emptyNode);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('boundValues')
        .that.have.property('test')
        .to.be.true();
    });
    it('should return Node with replaced bound value', () => {
      const node = Helper.defaultizeNode({
        boundValues: {
          test: false,
        },
      });

      const newNode = Node.setBoundValue('test', true, node);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('boundValues')
        .that.have.property('test')
        .to.be.true();
    });
    it('should return Node without affecting other bound values', () => {
      const node = Helper.defaultizeNode({
        boundValues: {
          other: false,
        },
      });

      const newNode = Node.setBoundValue('test', true, node);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('boundValues')
        .that.have.property('other')
        .to.be.false();
    });
  });
  // checks
  describe('isInputPinNode', () => {
    it('should return false for type not equal to xod/patch-nodes/input-*', () => {
      expect(Node.isInputPinNode(nodeOfType('@/input'))).to.be.false();
    });
    it('should return true for type equal to xod/patch-nodes/input-*', () => {
      expect(Node.isInputPinNode(nodeOfType('xod/patch-nodes/input-number'))).to.be.true();
    });
  });
  describe('isOutputPinNode', () => {
    it('should return false for type not equal to xod/patch-nodes/output-*', () => {
      expect(Node.isOutputPinNode(nodeOfType('test/test/output'))).to.be.false();
    });
    it('should return true for type equal to xod/patch-nodes/output-*', () => {
      expect(Node.isOutputPinNode(nodeOfType('xod/patch-nodes/output-number'))).to.be.true();
    });
  });
  describe('isPinNode', () => {
    it('should return false for type not equal to xod/patch-nodes/input-* or xod/patch-nodes/output-*', () => {
      expect(Node.isPinNode(nodeOfType('test/test/output'))).to.be.false();
    });
    it('should return true for type equal to xod/patch-nodes/input*', () => {
      expect(Node.isPinNode(nodeOfType('xod/patch-nodes/input-number'))).to.be.true();
    });
    it('should return true for type equal to xod/patch-nodes/output*', () => {
      expect(Node.isPinNode(nodeOfType('xod/patch-nodes/output-number'))).to.be.true();
    });
  });
  // etc
  describe('getPinNodeDataType', () => {
    it('should throw error for non-existent data-type', () => {
      expect(() => Node.getPinNodeDataType(nodeOfType('xod/patch-nodes/input-a')))
        .to.throw(TypeError);
    });
    it('should return `number` for xod/patch-nodes/input-number', () => {
      const res = Node.getPinNodeDataType(nodeOfType('xod/patch-nodes/input-number'));
      expect(res).to.be.equal(CONST.PIN_TYPE.NUMBER);
    });
    it('should return `number` for xod/patch-nodes/output-number', () => {
      const res = Node.getPinNodeDataType(nodeOfType('xod/patch-nodes/input-number'));
      expect(res).to.be.equal(CONST.PIN_TYPE.NUMBER);
    });
  });
  describe('getPinNodeDirection', () => {
    it('should throw for `xod/patch-nodes/invalid-pin-node`', () => {
      expect(() => Node.getPinNodeDirection(nodeOfType('xod/patch-nodes/invalid-pin-node')))
        .to.throw(TypeError);
    });
    it('should return `input` for `xod/patch-nodes/input-number`', () => {
      const res = Node.getPinNodeDirection(nodeOfType('xod/patch-nodes/input-number'));
      expect(res).to.be.equal('input');
    });
    it('should return `output` for `xod/patch-nodes/output-number`', () => {
      const res = Node.getPinNodeDirection(nodeOfType('xod/patch-nodes/output-number'));
      expect(res).to.be.equal('output');
    });
  });
});
