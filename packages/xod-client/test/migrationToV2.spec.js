import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { assert } from 'chai';
import { Maybe } from 'ramda-fantasy';

import core from 'xod-core';
import {
  toV2,
  getPatchByPath,
  getPatchLabel,
} from 'xod-project';
import initialState from '../src/core/state';
import generateReducers from '../src/core/reducer';
import { getProjectV2 } from '../src/project/selectors';
import {
  addNode,
  addLink,
  addPatch,
  renamePatch,
  deletePatch,
} from '../src/project/actions';

describe('projectV2 reducer', () => {
  // This is skipped because impurity of toV2 prevents autotesting.
  // But it's still useful to manually confirm things
  describe.skip('populateDemo', () => {
    let store = null;

    beforeEach(
      () => {
        store = createStore(generateReducers(['@/1']), initialState, applyMiddleware(thunk));
      }
    );

    const populateDemo = () => {
      const nodes = [];

      const dispatchAddNode = (nodeTypeKey, x, y) => {
        const action = addNode(nodeTypeKey, { x, y }, '@/1');
        const newNodeId = store.dispatch(action);
        nodes.push(newNodeId);
      };
      const dispatchAddLink = (o1, o2) => {
        const action = addLink(o1, o2);
        store.dispatch(action);
      };

      dispatchAddNode('xod/core/button', 100, 100);
      dispatchAddNode('xod/core/pot', 400, 100);
      dispatchAddNode('xod/core/led', 100, 400);
      dispatchAddNode('xod/core/servo', 400, 400);

      dispatchAddLink(
        { nodeId: nodes[0], pinKey: 'state' },
        { nodeId: nodes[2], pinKey: 'brightness' }
      );
    };

    const assertEqualChangesInV2 = () => {
      const project = core.getProjectPojo(store.getState());
      const expectedV2 = toV2(project);

      assert.deepEqual(
        expectedV2,
        store.getState().projectV2
      );
    };

    it('would be nice if `toV2` was pure :(', () => {
      populateDemo();
      const project = core.getProjectPojo(store.getState());

      assert.deepEqual(
        toV2(project),
        toV2(project)
      );
    });

    it('should add a node', () => {
      store.dispatch(addNode('xod/core/button', { x: 100, y: 100 }, '@/1'));
      assertEqualChangesInV2();
    });

    it('should have the same changes as old project after `populateDemo()`', () => {
      populateDemo();
      assertEqualChangesInV2();
    });
  });

  describe('Patch management', () => {
    let store = null;

    beforeEach(
      () => {
        store = createStore(generateReducers(['@/1']), initialState, applyMiddleware(thunk));
      }
    );

    it('should add a patch', () => {
      const newPatchLabel = 'Test patch';
      const addPatchAction = store.dispatch(addPatch(newPatchLabel));
      const newPatchPath = addPatchAction.payload.id;

      const projectV2 = getProjectV2(store.getState());
      const maybeNewPatch = getPatchByPath(newPatchPath, projectV2);
      assert.isTrue(Maybe.isJust(maybeNewPatch));

      const newPatch = maybeNewPatch.getOrElse(null);
      assert.equal(
        getPatchLabel(newPatch),
        newPatchLabel
      );
    });

    it('should rename a patch', () => {
      const addPatchAction = store.dispatch(addPatch('Initial label'));
      const patchPath = addPatchAction.payload.id;
      const newPatchLabel = 'new label';
      store.dispatch(renamePatch(patchPath, newPatchLabel));

      const projectV2 = getProjectV2(store.getState());
      const renamedPatch = getPatchByPath(patchPath, projectV2).getOrElse(null);

      assert.isOk(renamedPatch);
      assert.equal(
        getPatchLabel(renamedPatch),
        newPatchLabel
      );
    });

    it('should delete a patch', () => {
      // TODO: this test looks silly
      const addPatchAction = store.dispatch(addPatch('label'));
      const patchPath = addPatchAction.payload.id;
      store.dispatch(deletePatch(patchPath));

      const projectV2 = getProjectV2(store.getState());
      const maybeDeletedPatch = getPatchByPath(patchPath, projectV2);

      assert.isTrue(Maybe.isNothing(maybeDeletedPatch));
    });
  });
});

