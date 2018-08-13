import * as R from 'ramda';
import { assert } from 'chai';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import * as XP from 'xod-project';

import { loadXodball } from 'xod-project/test/helpers';

import initialState from '../src/core/state';
import generateReducers from '../src/core/reducer';
import hintingMiddleware from '../src/hinting/middleware';
import { getPatchErrors } from '../src/hinting/selectors';

import { switchPatchUnsafe } from '../src/editor/actions';
import {
  createProject,
  openProject,
  updateProjectMeta,
  addPatch,
  updatePatchDescription,
  updateNodeProperty,
  bulkMoveNodesAndComments,
} from '../src/project/actions';
import * as PAT from '../src/project/actionTypes';

import { getProject } from '../src/project/selectors';

import UPDATE_HINTING from '../src/hinting/actionType';
import { UPDATE_ERRORS_POLICY as POLICY } from '../src/hinting/validation.internal';

// =============================================================================
//
// Utility functions to check validation part of Hinting
//
// =============================================================================

const assertActionTypeEqual = (type, action) => assert.equal(action.type, type);

const assertActionUpdatesErrors = action =>
  assert.equal(
    action.type,
    UPDATE_HINTING,
    'Expected an action that updates hinting'
  );

// :: Action -> ErrorsUpdateData
const getErrorsUpdateData = action =>
  R.cond([
    [R.propEq('type', UPDATE_HINTING), R.path(['payload', 'errors'])],
    [R.T, assertActionUpdatesErrors],
  ])(action);

const assertPolicyEquals = (policy, action) => {
  const errData = getErrorsUpdateData(action);
  assert.equal(errData.policy, policy);
};

// :: (Function with asserts) -> Action -> _
const assertErrorsWith = R.curry((assertsFn, action) =>
  R.compose(errs => assertsFn(errs), R.prop('errors'), getErrorsUpdateData)(
    action
  )
);

// =============================================================================
//
// Tests
//
// =============================================================================

describe('Hinting', () => {
  let store;
  let dispatchedActions = [];

  describe('Validation', () => {
    beforeEach(() => {
      dispatchedActions = [];
      store = createStore(
        generateReducers({}),
        initialState,
        applyMiddleware(
          thunk,
          hintingMiddleware,
          // Next middleware collects dispatched actions for testing purposes
          () => next => action => {
            dispatchedActions = R.append(action, dispatchedActions);
            return next(action);
          }
        )
      );
    });

    it('validates all patches on creating new project', () => {
      store.dispatch(createProject());
      const project = getProject(store.getState());
      assertPolicyEquals(POLICY.OVERWRITE, dispatchedActions[1]);
      assertErrorsWith(errors => {
        const patchesInProject = XP.listPatchPaths(project);
        assert.sameMembers(R.keys(errors), patchesInProject);
      }, dispatchedActions[1]);
    });

    it('validates all patches on open a new project', () => {
      // Path to xodball resolves from `xod-project/test`
      const proj = loadXodball('./fixtures/broken-project.xodball');
      store.dispatch(openProject(proj));
      const project = getProject(store.getState());
      assertPolicyEquals(POLICY.OVERWRITE, dispatchedActions[1]);
      assertErrorsWith(errors => {
        const patchesInProject = XP.listPatchPaths(project);
        assert.sameMembers(R.keys(errors), patchesInProject);
        const patchErrors = getPatchErrors('@/main', errors);
        assert.lengthOf(patchErrors, 2);
      }, dispatchedActions[1]);
    });

    it('validates only dependent patches on adding new patch', () => {
      store.dispatch(addPatch('lala'));
      assertPolicyEquals(POLICY.ASSOC, dispatchedActions[1]);
      assertErrorsWith(
        errors =>
          assert.deepEqual(errors, {
            '@/lala': { errors: {}, nodes: {}, links: {} },
          }),
        dispatchedActions[1]
      );
    });

    it('do not validates anything on the project meta change', () => {
      store.dispatch(
        updateProjectMeta({
          name: 'yo',
          license: 'MIT',
          description: 'test',
          version: '0.0.1',
        })
      );
      assert.lengthOf(dispatchedActions, 1);
      assertActionTypeEqual(PAT.PROJECT_UPDATE_META, dispatchedActions[0]);
    });

    it('do not validates anything on the patch description change', () => {
      store.dispatch(updatePatchDescription('yo', '@/main'));
      assert.lengthOf(dispatchedActions, 1);
      assertActionTypeEqual(PAT.PATCH_DESCRIPTION_UPDATE, dispatchedActions[0]);
    });

    describe('node property update', () => {
      beforeEach(() => {
        const proj = loadXodball('./fixtures/blinking.xodball');
        store.dispatch(openProject(proj));
        store.dispatch(switchPatchUnsafe('@/main'));
        dispatchedActions = []; // clear actions history
      });

      it('validate on change a Node pin value', () => {
        store.dispatch(
          updateNodeProperty('SJ7g05EdFe', 'pin', 'B1eR5EOYg', '.5')
        );
        assertPolicyEquals(POLICY.ASSOC, dispatchedActions[1]);
        assertErrorsWith(
          errors => assert.hasAllKeys(errors, ['@/main']),
          dispatchedActions[1]
        );
      });

      it('validate on change the Terminal Node label', () => {
        store.dispatch(switchPatchUnsafe('@/blink'));
        dispatchedActions = []; // clear actions history
        store.dispatch(
          updateNodeProperty('B1eR5EOYg', 'property', 'label', 'PER')
        );
        assertPolicyEquals(POLICY.ASSOC, dispatchedActions[1]);
        assertErrorsWith(
          errors => assert.hasAllKeys(errors, ['@/blink', '@/main']),
          dispatchedActions[1]
        );
      });

      it('do not validate on change the Node description', () => {
        store.dispatch(
          updateNodeProperty('SJ7g05EdFe', 'property', 'description', 'hello')
        );
        assert.lengthOf(dispatchedActions, 1);
        assertActionTypeEqual(PAT.NODE_UPDATE_PROPERTY, dispatchedActions[0]);
      });

      it('do not validate on change the Node label', () => {
        store.dispatch(
          updateNodeProperty('SJ7g05EdFe', 'property', 'label', 'hello')
        );
        assert.lengthOf(dispatchedActions, 1);
        assertActionTypeEqual(PAT.NODE_UPDATE_PROPERTY, dispatchedActions[0]);
      });
    });

    describe('move nodes', () => {
      beforeEach(() => {
        const proj = loadXodball('./fixtures/variadics.xodball');
        store.dispatch(openProject(proj));
        dispatchedActions = []; // clear actions history
      });

      it('validate with merge on move the Terminal node on the patch with a variadic marker', () => {
        store.dispatch(
          bulkMoveNodesAndComments(
            ['S13u4WsDG'],
            [],
            { x: 100, y: 100 },
            '@/named-pins'
          )
        );
        assertPolicyEquals(POLICY.MERGE, dispatchedActions[1]);
        assertErrorsWith(
          errors => assert.hasAllKeys(errors, ['@/named-pins', '@/main']),
          dispatchedActions[1]
        );
      });

      it('do not validate on move a common Node', () => {
        store.dispatch(
          bulkMoveNodesAndComments(
            ['S1z24-iPG'],
            [],
            { x: 100, y: 100 },
            '@/main'
          )
        );
        assert.lengthOf(dispatchedActions, 1);
        assertActionTypeEqual(
          PAT.BULK_MOVE_NODES_AND_COMMENTS,
          dispatchedActions[0]
        );
      });
    });
  });
});
