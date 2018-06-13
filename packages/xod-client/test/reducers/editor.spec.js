import R from 'ramda';
import { assert } from 'chai';
import thunk from 'redux-thunk';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import configureStore from 'redux-mock-store';

import { isAmong } from 'xod-func-tools';
import { defaultizeProject } from 'xod-project/test/helpers';

import * as Actions from '../../src/editor/actions';
import * as Selectors from '../../src/editor/selectors';
import editorReducer from '../../src/editor/reducer';

import { EDITOR_MODE, SELECTION_ENTITY_TYPE } from '../../src/editor/constants';

const mockStore = configureStore([thunk]);
const testStore = state =>
  createStore(
    combineReducers({
      project: f => f || {},
      editor: editorReducer,
    }),
    state,
    applyMiddleware(thunk)
  );

describe('Editor reducer', () => {
  describe('selecting entities', () => {
    const mockState = {
      project: defaultizeProject({
        authors: ['Test Person'],
        description: '',
        license: '',
        version: '0.0.0',
        name: 'Test project',
        patches: {
          '@/1': {
            nodes: {
              1: {
                id: '1',
                type: 'xod/core/test',
                position: {
                  x: 138,
                  y: 432,
                },
                boundValues: {
                  in: 0,
                },
                label: '',
                description: '',
              },
            },
            links: {},
            path: '@/1',
            description: 'Main patch',
            attachments: [],
            comments: {},
          },
          'xod/core/test': {
            nodes: {
              noNativeImpl: {
                description: '',
                id: 'noNativeImpl',
                label: '',
                position: {
                  x: 100,
                  y: 100,
                },
                type: 'xod/patch-nodes/not-implemented-in-xod',
                boundValues: {},
              },
              in: {
                id: 'in',
                type: 'xod/patch-nodes/input-number',
                position: {
                  x: 0,
                  y: 0,
                },
                label: '',
                description: '',
                boundValues: {},
              },
            },
            links: {},
            path: 'xod/core/test',
            description: 'Test patch',
            attachments: [],
            comments: {},
          },
        },
      }),
      editor: {
        currentTabId: '@/1',
        mode: EDITOR_MODE.DEFAULT,
        tabs: {
          '@/1': {
            id: '@/1',
            patchPath: '@/1',
            selection: [],
            linkingPin: null,
          },
        },
      },
    };
    let store = null;

    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should select node', () => {
      store = testStore(mockState);
      const id = '1';
      store.dispatch(Actions.selectNode(id));

      assert.deepEqual(Selectors.getSelection(store.getState()), [
        {
          entity: SELECTION_ENTITY_TYPE.NODE,
          id,
        },
      ]);
    });
    it('should select link', () => {
      store = testStore(mockState);
      const id = '1';
      store.dispatch(Actions.selectLink(id));

      assert.deepEqual(Selectors.getSelection(store.getState()), [
        {
          entity: SELECTION_ENTITY_TYPE.LINK,
          id,
        },
      ]);
    });
    it('should deselect all', () => {
      store = testStore(mockState);
      const id = '1';
      store.dispatch(Actions.selectLink(id));
      store.dispatch(Actions.deselectAll());

      assert.deepEqual(store.getState(), mockState);
    });
    it('should select pin', () => {
      const nodeId = '1';
      const pinKey = 'in';
      const expectedActions = [Actions.setPinSelection(nodeId, pinKey)];

      store.dispatch(Actions.setPinSelection(nodeId, pinKey));
      assert.deepEqual(store.getActions(), expectedActions);
    });
    it('should deselect pin on second click', () => {
      store = testStore(mockState);
      const nodeId = '1';
      const pinKey = 'in';

      store.dispatch(Actions.linkPin(nodeId, pinKey));
      store.dispatch(Actions.linkPin(nodeId, pinKey));

      assert.isNull(Selectors.getLinkingPin(store.getState()));
    });
  });

  describe('working with tabs', () => {
    const mockState = {
      editor: {
        currentTabId: 'a',
        tabs: {
          a: {
            id: 'a',
            patchPath: '@/p1',
            index: 0,
          },
          b: {
            id: 'b',
            patchPath: '@/p2',
            index: 1,
          },
        },
      },
      project: defaultizeProject({
        patches: {
          '@/p1': {},
          '@/p2': {},
          '@/p3': {},
        },
      }),
    };
    const createTabsStore = state =>
      createStore(
        combineReducers({
          editor: editorReducer,
        }),
        state,
        applyMiddleware(thunk)
      );

    let store = null;

    beforeEach(() => {
      store = createTabsStore(mockState);
    });

    it('should add new tab', () => {
      store.dispatch(Actions.switchPatch('@/p3'));

      const tabIds = R.keys(store.getState().editor.tabs);
      const newTabId = R.reject(isAmong(['a', 'b']), tabIds)[0];

      assert.lengthOf(tabIds, 3);
      assert.equal(store.getState().editor.currentTabId, newTabId);
    });
    it('should close a tab and switch to another one there are any left open', () => {
      store.dispatch(Actions.closeTab('a'));

      assert.lengthOf(R.keys(store.getState().editor.tabs), 1);
      assert.equal(store.getState().editor.currentTabId, 'b');
    });
    it('should close the tab and set currentPatchPath to null if that was the last tab', () => {
      store.dispatch(Actions.closeTab('a'));
      store.dispatch(Actions.closeTab('b'));

      assert.isEmpty(store.getState().editor.tabs);
      assert.isNull(store.getState().editor.currentTabId);
    });
    it('should sort tabs', () => true);
  });
});
