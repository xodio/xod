import R from 'ramda';
import chai from 'chai';
import thunk from 'redux-thunk';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import configureStore from 'redux-mock-store';
import * as Actions from '../../app/actions';
import { editor } from '../../app/reducers/editor';
import * as EDITOR_MODE from '../../app/constants/editorModes';

const mockStore = configureStore([thunk]);
const testStore = (state) => createStore(
  combineReducers({
    editor,
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
        Actions.setModeUnsafe(mode),
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
      editor: {
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
      const id = 0;
      const expectedActions = [
        Actions.setNodeSelection(id),
      ];

      store.dispatch(Actions.selectNode(id));

      chai.expect(store.getActions()).to.deep.equal(expectedActions);
    });
    it('should deselect node on second click', () => {
      store = testStore(mockState);
      const id = 0;

      store.dispatch(Actions.selectNode(id));
      store.dispatch(Actions.selectNode(id));

      chai.expect(store.getState().editor.selection.length).to.be.equal(0);
    });
    it('should select link', () => {
      const id = 0;
      const expectedActions = [
        Actions.setLinkSelection(id),
      ];

      store.dispatch(Actions.selectLink(id));
      chai.expect(store.getActions()).to.deep.equal(expectedActions);
    });
    it('should deselect link on second click', () => {
      store = testStore(mockState);
      const id = 0;

      store.dispatch(Actions.selectLink(id));
      store.dispatch(Actions.selectLink(id));
      chai.expect(store.getState().editor.selection.length).to.be.equal(0);
    });
    it('should deselect all', () => {
      store = testStore(mockState);
      const id = 1;

      store.dispatch(Actions.selectLink(id));
      store.dispatch(Actions.deselectAll());

      chai.expect(store.getState()).to.deep.equal(mockState);
    });
    it('should select pin', () => {
      const id = 0;
      const expectedActions = [
        Actions.setModeUnsafe(EDITOR_MODE.LINKING),
        Actions.setPinSelection(id),
      ];

      store.dispatch(Actions.linkPin(id));
      chai.expect(store.getActions()).to.deep.equal(expectedActions);
    });
    it('should deselect pin on second click', () => {
      store = testStore(mockState);
      const id = 0;

      store.dispatch(Actions.linkPin(id));
      store.dispatch(Actions.linkPin(id));

      chai.expect(store.getState().editor.linkingPin).to.be.a('null');
    });
  });
});
