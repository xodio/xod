import * as Actions from '../app/actions';
import initialState from '../app/state';
import { newId, nodes, lastId, copyNode } from '../app/reducers';
import chai from 'chai';

describe('Nodes reducer', () => {
  describe('while adding node', () => {
    it('should insert node', () => {
      const oldState = initialState.project.nodes;
      const state = nodes(oldState, Actions.addNode({
        id: null,
        patchId: 1,
        typeId: 0,
        props: {
          label: 'node',
        },
      }));
      chai.assert(newId(oldState) + 1 === newId(state));
    });

    it('should set appropriate id for a new node', () => {
      const props = {
        label: 'node',
      };
      const oldState = initialState.project.nodes;
      const state = nodes(oldState, Actions.addNode({
        id: null,
        patchId: 1,
        typeId: 0,
        props,
      }));
      const newNode = state[lastId(state)];
      chai.assert(newNode.id === lastId(state));
    });

    it('should be reverse operation for node deletion', () => {
      let state = null;
      const props = {
        label: 'node',
      };
      const oldState = initialState.project.nodes;
      state = nodes(oldState, Actions.addNode({
        id: null,
        patchId: 1,
        typeId: 0,
        props,
      }));
      state = nodes(state, Actions.deleteNode(lastId(state)));
      chai.expect(state).to.deep.equal(oldState);
    });
  });

  describe('while removing node', () => {
    it('should remove node', () => {
      const oldState = initialState.project.nodes;
      const state = nodes(oldState, Actions.deleteNode(lastId(oldState)));

      chai.assert(lastId(oldState) - 1 === lastId(state));
    });

    it('should remove node with specified id', () => {
      const oldState = initialState.project.nodes;
      const removingNodeId = lastId(oldState);
      const state = nodes(oldState, Actions.deleteNode(removingNodeId));

      chai.assert(!state.hasOwnProperty(removingNodeId));
    });

    it('should be reverse operation for node insertion', () => {
      let state = null;
      const oldState = initialState.project.nodes;
      const removingNodeId = lastId(oldState);
      const removingNode = copyNode(oldState[removingNodeId]);
      state = nodes(oldState, Actions.deleteNode(removingNodeId));
      state = nodes(state, Actions.addNode(removingNode));
      chai.expect(state).to.deep.equal(oldState);
    });
  });

  describe('while moving node', () => {
    it('should move node', () => {
      const oldState = initialState.project.nodes;
      const position = {
        x: 0,
        y: 100,
      };
      const state = nodes(oldState, Actions.moveNode(lastId(oldState), position));

      const movedNode = state[lastId(oldState)];

      chai.expect(movedNode.position).to.deep.equal(position);
    });

    it('should not affect other nodes', () => {
      const oldState = initialState.project.nodes;
      const removingNodeId = lastId(oldState);
      const state = nodes(oldState, Actions.deleteNode(removingNodeId));

      chai.assert(!state.hasOwnProperty(removingNodeId));
    });
  });
});
