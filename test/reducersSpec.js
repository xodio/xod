import * as Actions from '../app/actions.js';
import { initialState } from '../app/state.js';
import { nodes } from '../app/reducers.js';
import { assert } from 'chai';

describe('Nodes reducer', function() {
  describe('while adding node', function () {
    it('should insert node', () => {
      "use strict";
      const state = nodes(initialState.project.nodes, Actions.addNode({
        id: null,
        patchId: 1,
        typeId: 0,
        props: {
          label: 'node'
        }
      }));
    });
  });
});
