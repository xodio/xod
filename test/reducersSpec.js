import * as Actions from '../app/actions';
import initialState from '../app/state';
import { newId, nodes, lastId, copyNode } from '../app/reducers';
import chai from 'chai';
import R from 'ramda';

describe('Nodes reducer', () => {
  const sharedNodesStore = {
    0: {
      id: 0,
      position: {
        x: 0,
        y: 100,
      },
    },
  };

  describe('while adding node', () => {
    let nodesStore = null;
    beforeEach(
      () => {
        nodesStore = R.clone(sharedNodesStore);
      }
    );

    it('should insert node', () => {
      const oldState = nodesStore;
      const state = nodes(oldState, Actions.addNode({}));
      chai.assert(newId(oldState) + 1 === newId(state));
    });

    it('should set appropriate id for a new node', () => {
      const state = nodes(nodesStore, Actions.addNode({}));
      const newNode = state[lastId(state)];
      chai.assert(newNode.id === lastId(state));
    });

    it('should be reverse operation for node deletion', () => {
      let state = null;
      state = nodes(nodesStore, Actions.addNode({}));
      state = nodes(state, Actions.deleteNode(lastId(state)));
      chai.expect(state).to.deep.equal(nodesStore);
    });
  });

  describe('while removing node', () => {
    let nodesStore = null;
    beforeEach(
      () => {
        nodesStore = R.clone(sharedNodesStore);
      }
    );

    it('should remove node', () => {
      const oldState = nodesStore;
      const state = nodes(oldState, Actions.deleteNode(lastId(oldState)));

      chai.assert(lastId(oldState) - 1 === lastId(state));
    });

    it('should remove node with specified id', () => {
      const oldState = nodesStore;
      const removingNodeId = lastId(oldState);
      const state = nodes(oldState, Actions.deleteNode(removingNodeId));

      chai.assert(!state.hasOwnProperty(removingNodeId));
    });

    it('should be reverse operation for node insertion', () => {
      let state = null;
      const removingNodeId = lastId(nodesStore);
      const removingNode = copyNode(nodesStore[removingNodeId]);
      state = nodes(nodesStore, Actions.deleteNode(removingNodeId));
      state = nodes(state, Actions.addNode(removingNode));
      chai.expect(state).to.deep.equal(nodesStore);
    });

    it('should not affect other nodes', () => {
      const oldState = nodesStore;
      const removingNodeId = lastId(oldState);
      const state = nodes(oldState, Actions.deleteNode(removingNodeId));

      chai.assert(!state.hasOwnProperty(removingNodeId));
    });
  });

  describe('while moving node', () => {
    let nodesStore = null;
    beforeEach(
      () => {
        nodesStore = R.clone(sharedNodesStore);
      }
    );

    it('should move node', () => {
      const oldState = nodesStore;
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
