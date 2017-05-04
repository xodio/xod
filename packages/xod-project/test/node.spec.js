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

  describe('getCurriedPins', () => {
    it('should return empty object for node without `pins` key', () => {
      expect(Node.getCurriedPins({})).to.be.an('object').and.empty();
    });
    it('should return empty object for node without pins', () => {
      expect(Node.getCurriedPins({ pins: {} })).to.be.an('object').and.empty();
    });
    it('should return object with shape { pinKey: pinValue }', () => {
      const node = {
        pins: {
          a: {
            curried: true,
            value: true,
          },
          b: {
            curried: true,
            value: 10,
          },
        },
      };

      expect(Node.getCurriedPins(node)).to.be.deep.equal({
        a: true,
        b: 10,
      });
    });
  });

  describe('getPinCurriedValue', () => {
    const node = Helper.defaultizeNode({
      pins: {
        existingAndCurried: {
          curried: true,
          value: 'hey-ho',
        },
        existingAndUncurried: {
          curried: false,
          value: 'ha-ha',
        },
      },
    });
    const checkJust = (pinName) => {
      const value = Node.getPinCurriedValue(pinName, node);
      expect(value.isJust).to.be.true();
      expect(value.getOrElse(null)).to.be.equal(node.pins[pinName].value);
    };

    it('should return Maybe.Nothing for undefined value', () => {
      const value = Node.getPinCurriedValue('non-existent', node);
      expect(value.isNothing).to.be.true();
    });
    it('should return Maybe.Just for defined value of curried pin', () => {
      const pinName = 'existingAndCurried';
      checkJust(pinName);
    });
    it('should return Maybe.Just for defined value of uncurried pin', () => {
      const pinName = 'existingAndUncurried';
      checkJust(pinName);
    });
  });
  describe('setPinCurriedValue', () => {
    it('should return Node with new curried value', () => {
      const newNode = Node.setPinCurriedValue('test', true, emptyNode);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('test')
        .that.have.property('value')
        .to.be.true();
    });
    it('should return Node with replaced curried value', () => {
      const node = Helper.defaultizeNode({
        pins: {
          test: { value: false },
        },
      });

      const newNode = Node.setPinCurriedValue('test', true, node);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('test')
        .that.have.property('value')
        .to.be.true();
    });
    it('should return Node without affecting on other curried pins', () => {
      const node = Helper.defaultizeNode({
        pins: {
          other: { value: false },
        },
      });

      const newNode = Node.setPinCurriedValue('test', true, node);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('other')
        .that.have.property('value')
        .to.be.false();
    });
  });
  describe('curryPin', () => {
    it('should return Node with curried `test` pin === true', () => {
      const newNode = Node.curryPin('test', true, emptyNode);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('test')
        .that.have.property('curried')
        .to.be.true();
    });
    it('should return Node with curried `test` pin === false', () => {
      const newNode = Node.curryPin('test', false, emptyNode);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('test')
        .that.have.property('curried')
        .to.be.false();
    });
    it('should return Node with curried `test` pin', () => {
      const node = Helper.defaultizeNode({
        pins: {
          test: { curried: false },
        },
      });

      const newNode = Node.curryPin('test', true, node);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('test')
        .that.have.property('curried')
        .to.be.true();
    });
    it('should return Node without affecting on other curried pins', () => {
      const node = Helper.defaultizeNode({
        pins: {
          other: { curried: false },
        },
      });

      const newNode = Node.curryPin('test', true, node);

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('other')
        .that.have.property('curried')
        .to.be.false();
    });
  });
  // checks
  describe('isInputPinNode', () => {
    it('should return false for type not equal to xod/core/input-*', () => {
      expect(Node.isInputPinNode(nodeOfType('@/input'))).to.be.false();
    });
    it('should return true for type equal to xod/core/input-*', () => {
      expect(Node.isInputPinNode(nodeOfType('xod/core/input-number'))).to.be.true();
    });
  });
  describe('isOutputPinNode', () => {
    it('should return false for type not equal to xod/core/output-*', () => {
      expect(Node.isOutputPinNode(nodeOfType('test/test/output'))).to.be.false();
    });
    it('should return true for type equal to xod/core/output-*', () => {
      expect(Node.isOutputPinNode(nodeOfType('xod/core/output-number'))).to.be.true();
    });
  });
  describe('isPinNode', () => {
    it('should return false for type not equal to xod/core/input-* or xod/core/output-*', () => {
      expect(Node.isPinNode(nodeOfType('test/test/output'))).to.be.false();
    });
    it('should return true for type equal to xod/core/input*', () => {
      expect(Node.isPinNode(nodeOfType('xod/core/input-number'))).to.be.true();
    });
    it('should return true for type equal to xod/core/output*', () => {
      expect(Node.isPinNode(nodeOfType('xod/core/output-number'))).to.be.true();
    });
  });
  describe('isPinCurried', () => {
    it('should return false for non-existent pin', () => {
      expect(Node.isPinCurried('test', emptyNode)).to.be.false();
    });
    it('should return false for pin without `curried` property equal to true', () => {
      const node = Helper.defaultizeNode({ pins: { test: {} } });
      expect(Node.isPinCurried('test', node)).to.be.false();
    });
    it('should return true for pin that curried', () => {
      const node = Helper.defaultizeNode({ pins: { test: { value: 1, curried: true } } });
      expect(Node.isPinCurried('test', node)).to.be.true();
    });
    it('should return true for pin that curried, even it haven\'t a value', () => {
      const node = Helper.defaultizeNode({ pins: { test: { curried: true } } });
      expect(Node.isPinCurried('test', node)).to.be.true();
    });
  });
  // etc
  describe('getPinNodeDataType', () => {
    it('should throw error for non-existent data-type', () => {
      expect(() => Node.getPinNodeDataType(nodeOfType('xod/core/input-a')))
        .to.throw(TypeError);
    });
    it('should return `number` for xod/core/input-number', () => {
      const res = Node.getPinNodeDataType(nodeOfType('xod/core/input-number'));
      expect(res).to.be.equal(CONST.PIN_TYPE.NUMBER);
    });
    it('should return `number` for xod/core/output-number', () => {
      const res = Node.getPinNodeDataType(nodeOfType('xod/core/input-number'));
      expect(res).to.be.equal(CONST.PIN_TYPE.NUMBER);
    });
  });
  describe('getPinNodeDirection', () => {
    it('should throw for `xod/core/invalid-pin-node`', () => {
      expect(() => Node.getPinNodeDirection(nodeOfType('xod/core/invalid-pin-node')))
        .to.throw(TypeError);
    });
    it('should return `input` for `xod/core/input-number`', () => {
      const res = Node.getPinNodeDirection(nodeOfType('xod/core/input-number'));
      expect(res).to.be.equal('input');
    });
    it('should return `output` for `xod/core/output-number`', () => {
      const res = Node.getPinNodeDirection(nodeOfType('xod/core/output-number'));
      expect(res).to.be.equal('output');
    });
  });
});
