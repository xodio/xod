import * as Actions from '../../app/actions';
import { newId, nodes, lastId, copyNode } from '../../app/reducers/nodes';
import chai from 'chai';
import R from 'ramda';

describe('Nodes reducer', () => {
  const sharedNodeStore = {
    0: {
      id: 0,
      position: {
        x: 0,
        y: 100,
      },
    },
  };

  describe('while adding node', () => {
    let nodeStore = null;
    beforeEach(
      () => {
        nodeStore = R.clone(sharedNodeStore);
      }
    );

    it('should insert node', () => {
      const oldState = nodeStore;
      const state = nodes(oldState, Actions.addNode({}));
      chai.assert(newId(oldState) + 1 === newId(state));
    });

    it('should set appropriate id for a new node', () => {
      const state = nodes(nodeStore, Actions.addNode({}));
      const newNode = state[lastId(state)];
      chai.assert(newNode.id === lastId(state));
    });

    it('should be reverse operation for node deletion', () => {
      let state = null;
      state = nodes(nodeStore, Actions.addNode({}));
      state = nodes(state, Actions.deleteNodeAction(lastId(state)));
      chai.expect(state).to.deep.equal(nodeStore);
    });
  });

  describe('while removing node', () => {
    let nodeStore = null;
    beforeEach(
      () => {
        nodeStore = R.clone(sharedNodeStore);
      }
    );

    it('should remove node', () => {
      const oldState = nodeStore;
      const state = nodes(oldState, Actions.deleteNodeAction(lastId(oldState)));

      chai.assert(lastId(oldState) - 1 === lastId(state));
    });

    it('should remove node with specified id', () => {
      const oldState = nodeStore;
      const removingNodeId = lastId(oldState);
      const state = nodes(oldState, Actions.deleteNodeAction(removingNodeId));

      chai.assert(!state.hasOwnProperty(removingNodeId));
    });

    it('should be reverse operation for node insertion', () => {
      let state = null;
      const removingNodeId = lastId(nodeStore);
      const removingNode = copyNode(nodeStore[removingNodeId]);
      state = nodes(nodeStore, Actions.deleteNodeAction(removingNodeId));
      state = nodes(state, Actions.addNode(removingNode));
      chai.expect(state).to.deep.equal(nodeStore);
    });

    it('should not affect other nodes', () => {
      const oldState = nodeStore;
      const removingNodeId = lastId(oldState);
      const state = nodes(oldState, Actions.deleteNodeAction(removingNodeId));

      chai.assert(!state.hasOwnProperty(removingNodeId));
    });
  });

  describe('while moving node', () => {
    let nodeStore = null;
    beforeEach(
      () => {
        nodeStore = R.clone(sharedNodeStore);
      }
    );

    it('should move node', () => {
      const oldState = nodeStore;
      const position = {
        x: 0,
        y: 100,
      };
      const state = nodes(oldState, Actions.moveNode(lastId(oldState), position));

      const movedNode = state[lastId(oldState)];

      chai.expect(movedNode.position).to.deep.equal(position);
    });
  });
});
