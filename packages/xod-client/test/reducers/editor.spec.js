import R from 'ramda';
import chai from 'chai';
import thunk from 'redux-thunk';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import configureStore from 'redux-mock-store';

import * as Actions from '../../src/editor/actions';
import editorReducer from '../../src/editor/reducer';
import { EDITOR_SET_MODE } from '../../src/editor/actionTypes';

import { EDITOR_MODE } from '../../src/editor/constants';

const mockStore = configureStore([thunk]);
const testStore = state => createStore(
  combineReducers({
    project: f => f || {},
    editor: editorReducer,
  }),
  state,
  applyMiddleware(thunk)
);

describe('Editor reducer', () => {
  describe('set mode', () => {
    const mockState = {
      editor: {
        mode: null,
      },
    };
    let store = null;

    beforeEach(
      () => {
        store = mockStore(mockState);
      }
    );

    const testMode = (mode) => {
      const expectedActions = [
        {
          type: EDITOR_SET_MODE,
          payload: {
            mode,
          },
        },
      ];
      store.dispatch(Actions.setMode(mode));
      chai.expect(store.getActions()).to.deep.equal(expectedActions);
    };

    it('should set mode to creating', () => testMode(EDITOR_MODE.CREATING_NODE));
    it('should set mode to editing', () => testMode(EDITOR_MODE.EDITING));
    it('should set mode to linking', () => testMode(EDITOR_MODE.LINKING));
    it('should set mode to default', () => testMode(EDITOR_MODE.DEFAULT));
  });

  describe('selecting entities', () => {
    const mockState = {
      project: {
        authors: [
          'Test Person',
        ],
        description: '',
        license: '',
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
                pins: {
                  in: {
                    key: 'in',
                    value: 0,
                  },
                },
              },
            },
            links: {},
            impls: {},
            pins: {},
            path: '@/1',
            label: 'Main',
          },
          'xod/core/test': {
            nodes: {},
            links: {},
            impls: {},
            pins: {
              in: {
                key: 'in',
                type: 'number',
                direction: 'input',
                label: 'in',
                description: '',
                order: 0,
                value: 0,
              },
            },
            path: 'xod/core/test',
            label: 'Test patch',
          },
        },
      },
      editor: {
        currentPatchId: '@/1',
        mode: EDITOR_MODE.DEFAULT,
        selection: [],
        linkingPin: null,
      },
    };
    let store = null;

    beforeEach(
      () => {
        store = mockStore(mockState);
      }
    );

    it('should select node', () => {
      const id = '1';
      const expectedActions = [
        Actions.setNodeSelection(id),
      ];

      store.dispatch(Actions.selectNode(id));

      chai.expect(store.getActions()).to.deep.equal(expectedActions);
    });
    it('should deselect node on second click', () => {
      store = testStore(mockState);
      const id = '1';

      store.dispatch(Actions.selectNode(id));
      store.dispatch(Actions.selectNode(id));

      chai.expect(store.getState().editor.selection.length).to.be.equal(0);
    });
    it('should select link', () => {
      const id = '1';
      const expectedActions = [
        Actions.setLinkSelection(id),
      ];

      store.dispatch(Actions.selectLink(id));
      chai.expect(store.getActions()).to.deep.equal(expectedActions);
    });
    it('should deselect link on second click', () => {
      store = testStore(mockState);
      const id = '1';

      store.dispatch(Actions.selectLink(id));
      store.dispatch(Actions.selectLink(id));
      chai.expect(store.getState().editor.selection.length).to.be.equal(0);
    });
    it('should deselect all', () => {
      store = testStore(mockState);
      const id = '1';
      store.dispatch(Actions.selectLink(id));
      store.dispatch(Actions.deselectAll());

      chai.expect(store.getState()).to.deep.equal(mockState);
    });
    it('should select pin', () => {
      const nodeId = '1';
      const pinKey = 'in';
      const expectedActions = [
        {
          type: EDITOR_SET_MODE,
          payload: {
            mode: EDITOR_MODE.LINKING,
          },
        },
        Actions.setPinSelection(nodeId, pinKey),
      ];

      store.dispatch(Actions.linkPin(nodeId, pinKey));
      chai.expect(store.getActions()).to.deep.equal(expectedActions);
    });
    it('should deselect pin on second click', () => {
      store = testStore(mockState);
      const nodeId = '1';
      const pinKey = 'in';

      store.dispatch(Actions.linkPin(nodeId, pinKey));
      store.dispatch(Actions.linkPin(nodeId, pinKey));

      chai.expect(store.getState().editor.linkingPin).to.be.a('null');
    });
  });

  describe('working with tabs', () => {
    const mockState = {
      editor: {
        currentPatchId: '1',
        tabs: {
          1: {
            id: '1',
            patchId: '1',
            index: 0,
          },
          2: {
            id: '2',
            patchId: '2',
            index: 0,
          },
        },
      },
    };
    const createTabsStore = state => createStore(
      combineReducers({
        editor: editorReducer,
      }),
      state,
      applyMiddleware(thunk)
    );

    let store = null;

    beforeEach(
      () => {
        store = createTabsStore(mockState);
      }
    );

    it('should add new tab', () => {
      store.dispatch(Actions.switchPatch('3'));

      chai.expect(R.keys(store.getState().editor.tabs)).to.have.lengthOf(3);
      chai.expect(store.getState().editor.currentPatchId).to.be.equal('3');
    });
    it('should close a tab and switch to another one there are any left open', () => {
      store.dispatch(Actions.closeTab(1));

      chai.expect(R.keys(store.getState().editor.tabs)).to.have.lengthOf(1);
      chai.expect(store.getState().editor.currentPatchId).to.be.equal('2');
    });
    it('should close the tab and set currentPatchId to null if that was the last tab', () => {
      store.dispatch(Actions.closeTab(1));
      store.dispatch(Actions.closeTab(2));

      chai.expect(R.keys(store.getState().editor.tabs)).to.have.lengthOf(0);
      chai.expect(store.getState().editor.currentPatchId).to.be.equal(null);
    });
    it('should sort tabs', () => true);
  });
});
