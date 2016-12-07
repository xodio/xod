import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Node from '../src/node';

import { expectEither } from './helpers';

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
      expectEither(
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
    it('should return id', () => {
      expect(Node.getNodeId({ id: '@/test' }))
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
      expectEither(
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
  // entity getters
  // entity setters
  // validations
  describe('validatePosition', () => {
    it('should return Either.Left for not valid position', () => {
      expect(Node.validatePosition('').isLeft).to.be.true();
      expect(Node.validatePosition([]).isLeft).to.be.true();
      expect(Node.validatePosition({ x: 1 }).isLeft).to.be.true();
      expect(Node.validatePosition({ x: '1', y: '5' }).isLeft).to.be.true();
    });
    it('should return Either.Right for valid position', () => {
      expect(Node.validatePosition({ x: 0, y: 0 }).isRight).to.be.true();
    });
  });
  // etc
});
