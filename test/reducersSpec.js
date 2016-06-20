import * as Actions from '../app/actions.js';
import { initialState } from '../app/state.js';
import { newId, nodes, lastId } from '../app/reducers.js';
import chai from 'chai';


describe('Nodes reducer', function() {
  describe('while adding node', function () {
    it('should insert node', () => {
      "use strict";
      const oldState = initialState.project.nodes;
      const state = nodes(initialState.project.nodes, Actions.addNode({
        id: null,
        patchId: 1,
        typeId: 0,
        props: {
          label: 'node'
        }
      }));
      chai.assert(newId(oldState) + 1=== newId(state));
    });

    it('should set appropriate id for a new node', () => {
      "use strict";
      const props = {
        label: 'node'
      };
      const oldState = initialState.project.nodes;
      const state = nodes(initialState.project.nodes, Actions.addNode({
        id: null,
        patchId: 1,
        typeId: 0,
        props
      }));
      const newNode = state[lastId(state)];
      chai.assert(newNode.id === lastId(state));
    });

    it('should be reverse operation for node deletion', () => {
      "use strict";
      let state = null;
      const props = {
        label: 'node'
      };
      const oldState = initialState.project.nodes;
      state = nodes(oldState, Actions.addNode({
        id: null,
        patchId: 1,
        typeId: 0,
        props
      }));
      state = nodes(state, Actions.deleteNode(lastId(state)));
      chai.expect(state).to.deep.equal(oldState);
    });
  });
});
