import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Node from '../src/node';
import * as CONST from '../src/constants';

import * as Helper from './helpers';

chai.use(dirtyChai);

describe('Node', () => {
  const checkNodeObject = (node) => {
    expect(node).to.be.an('object');
    expect(node).have.property('id');
    expect(node).to.have.property('position');
    expect(node).to.have.property('type');
  };

  // constructors
  describe('createNode', () => {
    it('should return Either.Right with node', () => {
      const newNode = Node.createNode({ x: 100, y: 100 }, '@/test');
      Helper.expectEither(
        checkNodeObject,
        newNode
      );
    });
  });
  describe('duplicateNode', () => {
    const node = {
      id: 'test',
      position: { x: 0, y: 0 },
      type: '@/test',
    };
    const newNode = Node.duplicateNode(node);

    it('should return the node object', () => {
      checkNodeObject(newNode);
    });
    it('should return node object with same properties but new id', () => {
      expect(newNode.id).not.equals(node.id);
      expect(newNode.position).deep.equal(node.position);
      expect(newNode.type).deep.equal(node.type);
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
      expect(Node.getNodeType({ type: '@/test' }))
        .to.be.equal('@/test');
    });
  });
  describe('getNodePosition', () => {
    it('should return node position', () => {
      expect(Node.getNodePosition({ position: { x: 1, y: 1 } }))
        .to.be.an('object')
        .that.have.keys(['x', 'y']);
    });
  });
  describe('setNodePosition', () => {
    it('should return Either.Right with node in new position', () => {
      const newNode = Node.setNodePosition({ x: 1, y: 1 }, { position: { x: 0, y: 0 } });
      Helper.expectEither(
        node => {
          expect(node)
            .to.be.an('object')
            .that.have.property('position');

          expect(node.position)
            .to.have.property('x')
            .to.be.equal(1);

          expect(node.position)
            .to.have.property('y')
            .to.be.equal(1);
        },
        newNode
      );
    });
  });
  describe('getNodeLabel', () => {
    it('should return node label', () => {
      expect(Node.getNodeLabel({ label: 'nodeLabel' })).to.be.equal('nodeLabel');
    });
    it('should return empty string for node without label', () => {
      expect(Node.getNodeLabel({})).to.be.equal('');
    });
  });
  describe('setNodeLabel', () => {
    it('should return Node with new label', () => {
      const label = 'new label';
      const newNode = Node.setNodeLabel(label, {});

      expect(newNode)
        .to.be.an('object')
        .that.have.property('label')
        .that.equals(label);
    });
  });

  describe('getPinCurriedValue', () => {
    const node = {
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
    };
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
      const newNode = Node.setPinCurriedValue('test', true, {});

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('test')
        .that.have.property('value')
        .to.be.true();
    });
    it('should return Node with replaced curried value', () => {
      const newNode = Node.setPinCurriedValue('test', true, { pins: { test: { value: false } } });

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('test')
        .that.have.property('value')
        .to.be.true();
    });
    it('should return Node without affecting on other curried pins', () => {
      const newNode = Node.setPinCurriedValue('test', true, { pins: { other: { value: false } } });

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
      const newNode = Node.curryPin('test', true, {});

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('test')
        .that.have.property('curried')
        .to.be.true();
    });
    it('should return Node with curried `test` pin === false', () => {
      const newNode = Node.curryPin('test', false, {});

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('test')
        .that.have.property('curried')
        .to.be.false();
    });
    it('should return Node with curried `test` pin', () => {
      const newNode = Node.curryPin('test', true, { pins: { test: { curried: false } } });

      expect(newNode)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.property('test')
        .that.have.property('curried')
        .to.be.true();
    });
    it('should return Node without affecting on other curried pins', () => {
      const newNode = Node.curryPin('test', true, { pins: { other: { curried: false } } });

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
    it('should return false for type not equal to xod/core/input*', () => {
      expect(Node.isInputPinNode({ type: '@/test/input' })).to.be.false();
    });
    it('should return true for type equal to xod/core/input*', () => {
      expect(Node.isInputPinNode({ type: 'xod/core/inputNumber' })).to.be.true();
    });
  });
  describe('isOutputPinNode', () => {
    it('should return false for type not equal to xod/core/output*', () => {
      expect(Node.isOutputPinNode({ type: '@/test/output' })).to.be.false();
    });
    it('should return true for type equal to xod/core/output*', () => {
      expect(Node.isOutputPinNode({ type: 'xod/core/outputNumber' })).to.be.true();
    });
  });
  describe('isPinNode', () => {
    it('should return false for type not equal to xod/core/input* or xod/core/output*', () => {
      expect(Node.isPinNode({ type: '@/test/output' })).to.be.false();
    });
    it('should return true for type equal to xod/core/input*', () => {
      expect(Node.isPinNode({ type: 'xod/core/inputNumber' })).to.be.true();
    });
    it('should return true for type equal to xod/core/output*', () => {
      expect(Node.isPinNode({ type: 'xod/core/outputNumber' })).to.be.true();
    });
  });
  describe('isPinCurried', () => {
    it('should return false for non-existent pin', () => {
      expect(Node.isPinCurried('test', {})).to.be.false();
    });
    it('should return false for pin without `curried` property equal to true', () => {
      expect(Node.isPinCurried('test', { pins: { test: {} } })).to.be.false();
    });
    it('should return true for pin that curried', () => {
      expect(Node.isPinCurried('test', { pins: { test: { value: 1, curried: true } } })).to.be.true();
    });
    it('should return true for pin that curried, even it haven\'t a value', () => {
      expect(Node.isPinCurried('test', { pins: { test: { curried: true } } })).to.be.true();
    });
  });
  // validations
  describe('validatePosition', () => {
    it('should return Either.Left for not valid position', () => {
      expect(Node.validatePosition('').isLeft).to.be.true();
      expect(Node.validatePosition([]).isLeft).to.be.true();
      expect(Node.validatePosition({ x: 1 }).isLeft).to.be.true();
      expect(Node.validatePosition({ x: '1', y: '5' }).isLeft).to.be.true();

      Helper.expectErrorMessage(expect, Node.validatePosition(''), CONST.ERROR.POSITION_INVALID);
    });
    it('should return Either.Right for valid position', () => {
      expect(Node.validatePosition({ x: 0, y: 0 }).isRight).to.be.true();
    });
  });
  // etc
  describe('getPinNodeDataType', () => {
    it('should return Either.Left with error for non-existent data-type', () => {
      const res = Node.getPinNodeDataType({}, { type: 'xod/core/inputA' });
      expect(res.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, res, CONST.ERROR.DATATYPE_INVALID);
    });
    it('should return Either.Right with `a` for xod/core/inputA', () => {
      const res = Node.getPinNodeDataType({ a: 'a' }, { type: 'xod/core/inputA' });
      Helper.expectEither(
        val => expect(val).to.be.equal('a'),
        res
      );
    });
    it('should return Either.Right with `a` for xod/core/outputA', () => {
      const res = Node.getPinNodeDataType({ a: 'a' }, { type: 'xod/core/inputA' });
      Helper.expectEither(
        val => expect(val).to.be.equal('a'),
        res
      );
    });
  });
  describe('getPinNodeDirection', () => {
    it('should return Either.Left with error for `xod/core/invalidPinNode`', () => {
      const res = Node.getPinNodeDirection({ type: 'xod/core/invalidPinNode' });
      expect(res.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, res, CONST.ERROR.PIN_DIRECTION_INVALID);
    });
    it('should return Either.Right with `input` for `xod/core/inputSomething`', () => {
      const res = Node.getPinNodeDirection({ type: 'xod/core/inputSomething' });
      Helper.expectEither(
        val => expect(val).to.be.equal('input'),
        res
      );
    });
    it('should return Either.Right with `output` for `xod/core/outputSomething`', () => {
      const res = Node.getPinNodeDirection({ type: 'xod/core/outputSomething' });
      Helper.expectEither(
        val => expect(val).to.be.equal('output'),
        res
      );
    });
  });
});
