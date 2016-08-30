import R from 'ramda';
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import generateReducers from '../reducer';
import Selectors from '../selectors';
import Serializer from '../serializers/mock';
import { EditorMiddleware } from '../middlewares';
import { addNode, addLink } from '../actions';

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

  componentDidMount() {
    this.populateDemo();
  }

  populateDemo() {
    const dispatchAddNode = (nodeTypeKey, x, y) => {
      const action = addNode(nodeTypeKey, { x, y }, 1);
      this.store.dispatch(action);
    };
    const dispatchAddLink = (o1, o2) => {
      const action = addLink(o1, o2);
      this.store.dispatch(action);
    };

    dispatchAddNode('core/button', 100, 100);
    dispatchAddNode('core/pot', 400, 100);
    dispatchAddNode('core/led', 100, 400);
    dispatchAddNode('core/servo', 400, 400);
    dispatchAddLink({ nodeId: 1, pinKey: 'state' }, { nodeId: 3, pinKey: 'brightness' });
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
