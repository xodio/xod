import R from 'ramda';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { assert } from 'chai';
import { Maybe } from 'ramda-fantasy';

import {
  getProjectName,
  lensPatch,
  listLocalPatches,
  listLibraryPatches,
  getPatchByPath,
  getPatchPath,
  getBaseName,
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
  createProject,
  renameProject,
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
  describe('Project management', () => {
    let store = null;

    beforeEach(
      () => {
        store = createStore(generateReducers(), initialState, applyMiddleware(thunk));
      }
    );

    it('should create a project', () => {
      const newProjectName = 'new-test-project';
      const initialProject = getProject(store.getState());
      store.dispatch(createProject(newProjectName));

      const newProject = getProject(store.getState());
      assert.notEqual(initialProject, newProject);
      assert.equal(
        newProjectName,
        getProjectName(newProject)
      );
      assert.deepEqual(
        [
          {
            impls: {},
            links: {},
            nodes: {},
            path: '@/main',
          },
        ],
        listLocalPatches(newProject),
        'new project has an empty patch with a name "main"'
      );
      assert.deepEqual(
        listLibraryPatches(initialProject),
        listLibraryPatches(newProject),
        'new project has the same library patches'
      );
    });

    it('should rename a project', () => {
      const initialProject = getProject(store.getState());
      const newName = 'new-name-for-my-project';
      store.dispatch(renameProject(newName));

      const renamedProject = getProject(store.getState());

      assert.equal(
        newName,
        getProjectName(renamedProject)
      );
      assert.deepEqual( // isTrue(R.eqBy(...)) will not provide a nice diff
        R.omit(['name'], initialProject),
        R.omit(['name'], renamedProject),
        'everything except the name stays the same'
      );
    });
  });

  describe('Patch management', () => {
    let store = null;

    beforeEach(
      () => {
        store = createStore(generateReducers(), initialState, applyMiddleware(thunk));
      }
    );

    it('should add a patch', () => {
      const addPatchAction = store.dispatch(addPatch('test-patch'));
      const newPatchPath = addPatchAction.payload.patchPath;

      const project = getProject(store.getState());
      const maybeNewPatch = getPatchByPath(newPatchPath, project);
      assert.isTrue(Maybe.isJust(maybeNewPatch));
    });

    it('should rename a patch', () => {
      const addPatchAction = store.dispatch(addPatch('initial-name'));
      const initialPatchPath = addPatchAction.payload.patchPath;
      const newPatchName = 'new-patch-name';
      const renameAction = store.dispatch(renamePatch(initialPatchPath, newPatchName));
      const { newPatchPath } = renameAction.payload;

      const project = getProject(store.getState());
      const renamedPatch = getPatchByPath(newPatchPath, project).getOrElse(null);

      assert.isOk(renamedPatch);
      assert.equal(
        R.compose(getBaseName, getPatchPath)(renamedPatch),
        newPatchName
      );
    });

    it('should delete a patch', () => {
      const addPatchAction = store.dispatch(addPatch('label'));
      const patchPath = addPatchAction.payload.patchPath;
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
        const addPatchAction = store.dispatch(addPatch('test-patch'));
        testPatchPath = addPatchAction.payload.patchPath;
      }
    );

    it('should add a node', () => {
      const nodeId = store.dispatch(addNode('xod/patch-nodes/input-number', { x: 0, y: 0 }, testPatchPath));

      const maybeNode = R.compose(
        getNodeById(nodeId),
        R.view(lensPatch(testPatchPath)),
        getProject
      )(store.getState());

      assert.isTrue(Maybe.isJust(maybeNode));
    });
    it('should move a node', () => {
      const nodeId = store.dispatch(addNode('xod/patch-nodes/input-number', { x: 0, y: 0 }, testPatchPath));
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
      const nodeId = store.dispatch(addNode('xod/patch-nodes/input-number', { x: 0, y: 0 }, testPatchPath));
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
      const nodeId = store.dispatch(addNode('xod/patch-nodes/output-number', { x: 0, y: 0 }, testPatchPath));
      const pinKey = '__in__';
      const desiredPinValue = 42;
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
      const nodeId = store.dispatch(addNode('xod/patch-nodes/input-number', { x: 0, y: 0 }, testPatchPath));
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
    let inNodeId = '';
    let outNodeId = '';

    beforeEach(
      () => {
        store = createStore(generateReducers(), initialState, applyMiddleware(thunk));
        const addPatchAction = store.dispatch(addPatch('test-patch'));
        testPatchPath = addPatchAction.payload.patchPath;
        inNodeId = store.dispatch(addNode('xod/patch-nodes/input-number', { x: 100, y: 100 }, testPatchPath));
        outNodeId = store.dispatch(addNode('xod/patch-nodes/output-number', { x: 500, y: 500 }, testPatchPath));
      }
    );

    it('should add a link', () => {
      store.dispatch(addLink(
        { nodeId: inNodeId, pinKey: '__out__' },
        { nodeId: outNodeId, pinKey: '__in__' }
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
        { nodeId: inNodeId, pinKey: '__out__' },
        { nodeId: outNodeId, pinKey: '__in__' }
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

