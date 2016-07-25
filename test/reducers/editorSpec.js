import R from 'ramda';
import chai from 'chai';
import thunk from 'redux-thunk';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import configureStore from 'redux-mock-store';
import * as Actions from '../../app/actions';
import { editor } from '../../app/reducers/editor';
import * as EDITOR_MODE from '../../app/constants/editorModes';

describe('Editor reducer', () => {
  describe('set mode', () => {
    const mockState = {
      mode: EDITOR_MODE.DEFAULT,
    };
    let store = null;

    beforeEach(
      () => {
        store = R.clone(mockState);
      }
    );

    it('should set mode to creating', () => {
      const state = editor(store, Actions.setMode(EDITOR_MODE.CREATING));
      chai.expect(state.mode).to.be.equal(EDITOR_MODE.CREATING);
    });
    it('should set mode to editing', () => {
      const state = editor(store, Actions.setMode(EDITOR_MODE.EDITING));
      chai.expect(state.mode).to.be.equal(EDITOR_MODE.EDITING);
    });
    it('should set mode to linking', () => {
      const state = editor(store, Actions.setMode(EDITOR_MODE.LINKING));
      chai.expect(state.mode).to.be.equal(EDITOR_MODE.LINKING);
    });
    it('should set mode to default', () => {
      const state = editor(store, Actions.setMode(EDITOR_MODE.DEFAULT));
      chai.expect(state.mode).to.be.equal(EDITOR_MODE.DEFAULT);
    });
  });

  describe('selecting entities', () => {
    const mockState = {
      editor: {
        selection: [],
        linkingPin: null,
      },
    };
    const mockStore = configureStore([thunk]);
    const testStore = (state) => createStore(
      combineReducers({
        editor,
      }),
      state,
      applyMiddleware(thunk)
    );
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
        Actions.setMode(EDITOR_MODE.LINKING),
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
