import R from 'ramda';
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import generateReducers from '../reducers/';
import Selectors from '../selectors/';
import Serializer from '../serializers/mock';
import { EditorMiddleware } from '../middlewares';

import App from './App';

export default class Root extends React.Component {

  constructor(props) {
    super(props);

    this.serializer = new Serializer();
    const initialState = this.serializer.getState();
    this.patches = Selectors.Project.getPatches(initialState);
    this.store = createStore(this.createReducers(this.patches), initialState, EditorMiddleware);

    this.store.subscribe(() => {
      const rootState = this.store.getState();
      const statePatches = Selectors.Project.getPatches(rootState);
      if (Selectors.Project.isPatchesUpdated(statePatches, this.patches)) {
        this.store.replaceReducer(this.createReducers(statePatches));
      }
    });
  }

  createReducers(patches) {
    this.patches = patches;
    const patchIds = R.keys(this.patches);
    return generateReducers(patchIds);
  }

  render() {
    return (
      <Provider store={this.store}>
        <App />
      </Provider>
    );
  }
}
