import R from 'ramda';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { assert } from 'chai';
import { Maybe } from 'ramda-fantasy';
import { defaultizeProject } from 'xod-project/test/helpers';

import * as XP from 'xod-project';

import initialState from '../src/core/state';
import generateReducers from '../src/core/reducer';
import { getProject } from '../src/project/selectors';

import { NODETYPE_ERROR_TYPES } from '../src/editor/constants';
import { NODETYPE_ERRORS } from '../src/project/messages';

import { addError } from '../src/messages/actions';
import { switchPatch } from '../src/editor/actions';
import {
  openProject,
  createProject,
  updateProjectMeta,
  addPatch,
  renamePatch,
  deletePatch,
  updatePatchDescription,
  addNode,
  updateNodeProperty,
  addLink,
  addComment,
  resizeComment,
  editComment,
  bulkDeleteNodesAndComments,
} from '../src/project/actions';

describe('project reducer', () => {
  describe('Project management', () => {
    let store = null;

    beforeEach(() => {
      store = createStore(
        generateReducers(),
        initialState,
        applyMiddleware(thunk)
      );
    });

    it('should create a project', () => {
      const initialProject = getProject(store.getState());
      store.dispatch(createProject());

      const newProject = getProject(store.getState());
      assert.notEqual(initialProject, newProject);
      assert.equal(XP.getProjectName(newProject), '');

      const expectedPatches = R.compose(
        XP.listLocalPatches,
        XP.assocPatch(XP.getLocalPath('main'), XP.createPatch()),
        XP.createProject
      )();
      assert.deepEqual(
        expectedPatches,
        XP.listLocalPatches(newProject),
        'new project has an empty patch with a name "main"'
      );
      assert.deepEqual(
        XP.listLibraryPatches(initialProject),
        XP.listLibraryPatches(newProject),
        'new project has the same library patches'
      );
    });

    it('should update project meta (license, description, version)', () => {
      store.dispatch(
        updateProjectMeta({
          license: 'TEST',
          version: '1.2.3',
          description: 'Test passed',
        })
      );
      const proj = getProject(store.getState());
      const newLicense = XP.getProjectLicense(proj);
      const newVersion = XP.getProjectVersion(proj);
      const newDescription = XP.getProjectDescription(proj);

      assert.equal(newLicense, 'TEST');
      assert.equal(newVersion, '1.2.3');
      assert.equal(newDescription, 'Test passed');
    });
  });

  describe('Patch management', () => {
    let store = null;

    beforeEach(() => {
      store = createStore(
        generateReducers(),
        initialState,
        applyMiddleware(thunk)
      );
    });

    it('should add a patch', () => {
      const addPatchAction = store.dispatch(addPatch('test-patch'));
      const newPatchPath = addPatchAction.payload.patchPath;

      const project = getProject(store.getState());
      const maybeNewPatch = XP.getPatchByPath(newPatchPath, project);
      assert.isTrue(Maybe.isJust(maybeNewPatch));
    });

    it('should rename a patch', () => {
      const addPatchAction = store.dispatch(addPatch('initial-name'));
      const initialPatchPath = addPatchAction.payload.patchPath;
      const newPatchName = 'new-patch-name';
      const renameAction = store.dispatch(
        renamePatch(initialPatchPath, newPatchName)
      );
      const { newPatchPath } = renameAction.payload;

      const project = getProject(store.getState());
      const renamedPatch = XP.getPatchByPath(newPatchPath, project).getOrElse(
        null
      );

      assert.isOk(renamedPatch);
      assert.equal(
        R.compose(XP.getBaseName, XP.getPatchPath)(renamedPatch),
        newPatchName
      );
    });

    it('should change patch description', () => {
      const addPatchAction = store.dispatch(addPatch('test-patch'));
      const newPatchPath = addPatchAction.payload.patchPath;

      store.dispatch(updatePatchDescription('test-passed', newPatchPath));

      const project = getProject(store.getState());
      const patch = XP.getPatchByPathUnsafe(newPatchPath, project);
      const newDescription = XP.getPatchDescription(patch);

      assert.equal(newDescription, 'test-passed');
    });

    it('should delete a patch', () => {
      const addPatchAction = store.dispatch(addPatch('label'));
      const patchPath = addPatchAction.payload.patchPath;
      store.dispatch(deletePatch(patchPath));

      const project = getProject(store.getState());
      const maybeDeletedPatch = XP.getPatchByPath(patchPath, project);

      assert.isTrue(Maybe.isNothing(maybeDeletedPatch));
    });
  });

  describe('Node management', () => {
    let store = null;
    let testPatchPath = '';

    beforeEach(() => {
      store = createStore(
        generateReducers(),
        initialState,
        applyMiddleware(thunk)
      );
      const addPatchAction = store.dispatch(addPatch('test-patch'));
      testPatchPath = addPatchAction.payload.patchPath;
    });

    it('should add a node', () => {
      const nodeId = store.dispatch(
        addNode('xod/patch-nodes/input-number', { x: 0, y: 0 }, testPatchPath)
      );

      const maybeNode = R.compose(
        XP.getNodeById(nodeId),
        XP.getPatchByPathUnsafe(testPatchPath),
        getProject
      )(store.getState());

      assert.isTrue(Maybe.isJust(maybeNode));
    });
    it('should update node label', () => {
      const nodeId = store.dispatch(
        addNode('xod/patch-nodes/input-number', { x: 0, y: 0 }, testPatchPath)
      );
      const desiredLabel = 'desired label';
      store.dispatch(
        updateNodeProperty(nodeId, 'property', 'label', desiredLabel)
      );

      const maybeNode = R.compose(
        XP.getNodeById(nodeId),
        XP.getPatchByPathUnsafe(testPatchPath),
        getProject
      )(store.getState());

      const actualLabel = Maybe.maybe({}, XP.getNodeLabel, maybeNode);

      assert.deepEqual(desiredLabel, actualLabel);
    });
    it("should update node's pin value ", () => {
      const nodeId = store.dispatch(
        addNode('xod/patch-nodes/output-number', { x: 0, y: 0 }, testPatchPath)
      );
      const pinKey = '__in__';
      const desiredPinValue = 42;
      store.dispatch(
        updateNodeProperty(nodeId, 'pin', pinKey, desiredPinValue)
      );

      const maybeNode = R.compose(
        XP.getNodeById(nodeId),
        XP.getPatchByPathUnsafe(testPatchPath),
        getProject
      )(store.getState());

      const maybePinValue = maybeNode.chain(XP.getBoundValue(pinKey));

      const actualPinValue = Maybe.maybe({}, R.identity, maybePinValue);

      assert.deepEqual(desiredPinValue, actualPinValue);
    });
    it('should delete a node', () => {
      const nodeId = store.dispatch(
        addNode('xod/patch-nodes/input-number', { x: 0, y: 0 }, testPatchPath)
      );
      store.dispatch(
        bulkDeleteNodesAndComments([nodeId], [], [], testPatchPath)
      );

      const maybeNode = R.compose(
        XP.getNodeById(nodeId),
        XP.getPatchByPathUnsafe(testPatchPath),
        getProject
      )(store.getState());

      assert.isTrue(Maybe.isNothing(maybeNode));
    });
  });

  describe('Link management', () => {
    let store = null;
    let testPatchPath = '';
    let inNodeId = '';
    let inNodeId2 = '';
    let outNodeId = '';

    beforeEach(() => {
      store = createStore(
        generateReducers(),
        initialState,
        applyMiddleware(thunk)
      );
      const addPatchAction = store.dispatch(addPatch('test-patch'));
      testPatchPath = addPatchAction.payload.patchPath;
      inNodeId = store.dispatch(
        addNode(
          'xod/patch-nodes/input-number',
          { x: 100, y: 100 },
          testPatchPath
        )
      );
      inNodeId2 = store.dispatch(
        addNode(
          'xod/patch-nodes/input-number',
          { x: 200, y: 200 },
          testPatchPath
        )
      );
      outNodeId = store.dispatch(
        addNode(
          'xod/patch-nodes/output-number',
          { x: 500, y: 500 },
          testPatchPath
        )
      );
    });

    it('should add a link', () => {
      store.dispatch(
        addLink(
          { nodeId: inNodeId, pinKey: '__out__' },
          { nodeId: outNodeId, pinKey: '__in__' },
          '@/test-patch'
        )
      );

      const links = R.compose(
        XP.listLinks,
        XP.getPatchByPathUnsafe(testPatchPath),
        getProject
      )(store.getState());

      assert.equal(1, links.length);
    });
    it('should relink a link', () => {
      store.dispatch(
        addLink(
          { nodeId: inNodeId, pinKey: '__out__' },
          { nodeId: outNodeId, pinKey: '__in__' },
          '@/test-patch'
        )
      );
      store.dispatch(
        addLink(
          { nodeId: inNodeId2, pinKey: '__out__' },
          { nodeId: outNodeId, pinKey: '__in__' },
          '@/test-patch'
        )
      );

      const links = R.compose(
        XP.listLinks,
        XP.getPatchByPathUnsafe(testPatchPath),
        getProject
      )(store.getState());

      assert.equal(1, links.length);
    });
    it('should delete a link', () => {
      store.dispatch(
        addLink(
          { nodeId: inNodeId, pinKey: '__out__' },
          { nodeId: outNodeId, pinKey: '__in__' },
          '@/test-patch'
        )
      );

      const linkId = R.compose(
        XP.getLinkId,
        R.head,
        XP.listLinks,
        XP.getPatchByPathUnsafe(testPatchPath),
        getProject
      )(store.getState());

      store.dispatch(
        bulkDeleteNodesAndComments([], [linkId], [], testPatchPath)
      );

      const links = R.compose(
        XP.listLinks,
        XP.getPatchByPathUnsafe(testPatchPath),
        getProject
      )(store.getState());

      assert.equal(0, links.length);
    });
  });

  describe('Comment management', () => {
    let store = null;
    let testPatchPath = '';

    const getCommentsList = R.uncurryN(2)(patchPath =>
      R.compose(XP.listComments, XP.getPatchByPathUnsafe(patchPath), getProject)
    );

    const getAddedComment = R.uncurryN(2)(patchPath =>
      R.compose(R.head, getCommentsList(patchPath))
    );

    const getAddedCommentId = R.uncurryN(2)(patchPath =>
      R.compose(XP.getCommentId, getAddedComment(patchPath))
    );

    beforeEach(() => {
      store = createStore(
        generateReducers(),
        initialState,
        applyMiddleware(thunk)
      );
      const addPatchAction = store.dispatch(addPatch('test-patch'));
      testPatchPath = addPatchAction.payload.patchPath;
    });

    it('should add a comment', () => {
      store.dispatch(addComment());

      const comments = getCommentsList(testPatchPath, store.getState());
      assert.equal(comments.length, 1);
    });
    it('should delete a comment', () => {
      store.dispatch(addComment());
      const testCommentId = getAddedCommentId(testPatchPath, store.getState());

      store.dispatch(
        bulkDeleteNodesAndComments([], [], [testCommentId], testPatchPath)
      );

      const comments = getCommentsList(testPatchPath, store.getState());
      assert.equal(comments.length, 0);
    });
    it('should resize a comment', () => {
      store.dispatch(addComment());
      const testCommentId = getAddedCommentId(testPatchPath, store.getState());
      const newSize = {
        width: 100100100,
        height: 200200200,
        units: XP.UNITS.PIXELS,
      };

      store.dispatch(resizeComment(testCommentId, newSize));

      const commentAfter = getAddedComment(testPatchPath, store.getState());
      assert.deepEqual(XP.getCommentSize(commentAfter), newSize);
    });
    it("should edit comment's content", () => {
      store.dispatch(addComment());
      const testCommentId = getAddedCommentId(testPatchPath, store.getState());
      const newContent = 'totally new content for test comment';

      store.dispatch(editComment(testCommentId, newContent));

      const commentAfter = getAddedComment(testPatchPath, store.getState());
      assert.deepEqual(XP.getCommentContent(commentAfter), newContent);
    });
  });
});

describe('project actions', () => {
  describe('bulkDeleteNodesAndComments', () => {
    let store = null;
    const project = defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            instanceOfPatchInQuestion: { type: '@/foo' },
            someOtherNode: { type: 'xod/patch-nodes/input-number' },
          },
          links: {
            someLink: {
              input: {
                nodeId: 'instanceOfPatchInQuestion',
                pinKey: 'importantTerminal',
              },
              output: { nodeId: 'someOtherNode', pinKey: '__out__' },
            },
          },
        },
        '@/foo': {
          nodes: {
            importantTerminal: { type: 'xod/patch-nodes/input-number' },
            notImportantTerminal: { type: 'xod/patch-nodes/input-number' },
          },
        },
      },
    });

    beforeEach(() => {
      store = createStore(
        generateReducers(),
        initialState,
        applyMiddleware(thunk)
      );
      store.dispatch(openProject(project));
    });

    it('should display an error message if we try to delete a used terminal node', () => {
      const patchPath = '@/foo';
      store.dispatch(switchPatch(patchPath));
      const action = store.dispatch(
        bulkDeleteNodesAndComments(['importantTerminal'], [], [], patchPath)
      );
      const expectedAction = addError(
        NODETYPE_ERRORS[NODETYPE_ERROR_TYPES.CANT_DELETE_USED_PIN_OF_PATCHNODE]
      );

      assert.deepEqual(action.type, expectedAction.type);
      assert.deepEqual(action.payload, expectedAction.payload);
    });
  });
});
