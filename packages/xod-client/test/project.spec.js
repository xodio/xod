import R from 'ramda';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { assert } from 'chai';
import { Maybe } from 'ramda-fantasy';

import {
  lensPatch,
  getPatchByPath,
  getPatchLabel,
  getNodeById,
  getNodePosition,
  getNodeLabel,
  getPinCurriedValue,
  listLinks,
  getLinkId,
} from 'xod-project';
import initialState from '../src/core/state';
import generateReducers from '../src/core/reducer';
import { getProject } from '../src/project/selectors';
import {
  addPatch,
  renamePatch,
  deletePatch,
  addNode,
  moveNode,
  updateNodeProperty,
  deleteNode,
  addLink,
  deleteLink,
} from '../src/project/actions';

describe('project reducer', () => {
  describe('Patch management', () => {
    let store = null;

    beforeEach(
      () => {
        store = createStore(generateReducers(), initialState, applyMiddleware(thunk));
      }
    );

    it('should add a patch', () => {
      const newPatchLabel = 'Test patch';
      const addPatchAction = store.dispatch(addPatch(newPatchLabel));
      const newPatchPath = addPatchAction.payload.id;

      const project = getProject(store.getState());
      const maybeNewPatch = getPatchByPath(newPatchPath, project);
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

      const project = getProject(store.getState());
      const renamedPatch = getPatchByPath(patchPath, project).getOrElse(null);

      assert.isOk(renamedPatch);
      assert.equal(
        getPatchLabel(renamedPatch),
        newPatchLabel
      );
    });

    it('should delete a patch', () => {
      const addPatchAction = store.dispatch(addPatch('label'));
      const patchPath = addPatchAction.payload.id;
      store.dispatch(deletePatch(patchPath));

      const project = getProject(store.getState());
      const maybeDeletedPatch = getPatchByPath(patchPath, project);

      assert.isTrue(Maybe.isNothing(maybeDeletedPatch));
    });
  });

  describe('Node management', () => {
    let store = null;
    let testPatchPath = '';

    beforeEach(
      () => {
        store = createStore(generateReducers(), initialState, applyMiddleware(thunk));
        const addPatchAction = store.dispatch(addPatch('Test patch'));
        testPatchPath = addPatchAction.payload.id;
      }
    );

    it('should add a node', () => {
      const nodeId = store.dispatch(addNode('xod/core/button', { x: 0, y: 0 }, testPatchPath));

      const maybeNode = R.compose(
        getNodeById(nodeId),
        R.view(lensPatch(testPatchPath)),
        getProject
      )(store.getState());

      assert.isTrue(Maybe.isJust(maybeNode));
    });
    it('should move a node', () => {
      const nodeId = store.dispatch(addNode('xod/core/button', { x: 0, y: 0 }, testPatchPath));
      const desiredPosition = { x: 111, y: 222 };
      store.dispatch(moveNode(nodeId, desiredPosition));

      const maybeNode = R.compose(
        getNodeById(nodeId),
        R.view(lensPatch(testPatchPath)),
        getProject
      )(store.getState());

      const actualPosition = Maybe.maybe({}, getNodePosition, maybeNode);

      assert.deepEqual(
        desiredPosition,
        actualPosition
      );
    });
    it('should update node label', () => {
      const nodeId = store.dispatch(addNode('xod/core/button', { x: 0, y: 0 }, testPatchPath));
      const desiredLabel = 'desired label';
      store.dispatch(updateNodeProperty(nodeId, 'property', 'label', desiredLabel));

      const maybeNode = R.compose(
        getNodeById(nodeId),
        R.view(lensPatch(testPatchPath)),
        getProject
      )(store.getState());

      const actualLabel = Maybe.maybe({}, getNodeLabel, maybeNode);

      assert.deepEqual(
        desiredLabel,
        actualLabel
      );
    });
    it('should update node\'s pin value ', () => {
      const nodeId = store.dispatch(addNode('xod/core/pot', { x: 0, y: 0 }, testPatchPath));
      const pinKey = 'sample';
      const desiredPinValue = true;
      store.dispatch(updateNodeProperty(nodeId, 'pin', pinKey, desiredPinValue));

      const maybeNode = R.compose(
        getNodeById(nodeId),
        R.view(lensPatch(testPatchPath)),
        getProject
      )(store.getState());

      const maybePinValue = maybeNode.chain(getPinCurriedValue(pinKey));

      const actualPinValue = Maybe.maybe({}, R.identity, maybePinValue);

      assert.deepEqual(
        desiredPinValue,
        actualPinValue
      );
    });
    it('should delete a node', () => {
      const nodeId = store.dispatch(addNode('xod/core/button', { x: 0, y: 0 }, testPatchPath));
      store.dispatch(deleteNode(nodeId));

      const maybeNode = R.compose(
        getNodeById(nodeId),
        R.view(lensPatch(testPatchPath)),
        getProject
      )(store.getState());

      assert.isTrue(Maybe.isNothing(maybeNode));
    });
  });

  describe('Link management', () => {
    let store = null;
    let testPatchPath = '';
    let potNodeId = '';
    let ledNodeId = '';

    beforeEach(
      () => {
        store = createStore(generateReducers(), initialState, applyMiddleware(thunk));
        const addPatchAction = store.dispatch(addPatch('Test patch'));
        testPatchPath = addPatchAction.payload.id;
        potNodeId = store.dispatch(addNode('xod/core/pot', { x: 100, y: 100 }, testPatchPath));
        ledNodeId = store.dispatch(addNode('xod/core/led', { x: 500, y: 500 }, testPatchPath));
      }
    );

    it('should add a link', () => {
      store.dispatch(addLink(
        { nodeId: potNodeId, pinKey: 'value' },
        { nodeId: ledNodeId, pinKey: 'brightness' }
      ));

      const links = R.compose(
        listLinks,
        R.view(lensPatch(testPatchPath)),
        getProject
      )(store.getState());

      assert.equal(1, links.length);
    });

    it('should delete a link', () => {
      store.dispatch(addLink(
        { nodeId: potNodeId, pinKey: 'value' },
        { nodeId: ledNodeId, pinKey: 'brightness' }
      ));

      const linkId = R.compose(
        getLinkId,
        R.head,
        listLinks,
        R.view(lensPatch(testPatchPath)),
        getProject
      )(store.getState());

      store.dispatch(deleteLink(linkId, testPatchPath));

      const links = R.compose(
        listLinks,
        R.view(lensPatch(testPatchPath)),
        getProject
      )(store.getState());

      assert.equal(0, links.length);
    });
  });
});

