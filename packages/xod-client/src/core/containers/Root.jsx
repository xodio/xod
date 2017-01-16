import R from 'ramda';
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import core from 'xod-core';

import DevTools from '../../utils/devtools';
import generateReducers from '../reducer';
import initialState from '../state';
import EditorMiddleware from '../middlewares';
import { addNode, addLink } from '../actions';

export default class Root extends React.Component {

  constructor(props) {
    super(props);

    this.patches = core.getPatches(initialState);
    this.store = createStore(
      this.createReducers(this.patches, this.props.extraReducers),
      initialState,
      EditorMiddleware
    );

    this.store.subscribe(() => {
      const rootState = this.store.getState();
      const statePatches = core.getPatches(rootState);
      if (core.isPatchesUpdated(statePatches, this.patches)) {
        this.store.replaceReducer(this.createReducers(statePatches, this.props.extraReducers));
      }
    });
  }

  componentDidMount() {
    this.populateDemo();
  }

  populateDemo() {
    const nodes = [];

    const dispatchAddNode = (nodeTypeKey, x, y) => {
      const action = addNode(nodeTypeKey, { x, y }, '@/1');
      const newNodeId = this.store.dispatch(action);
      nodes.push(newNodeId);
    };
    const dispatchAddLink = (o1, o2) => {
      const action = addLink(o1, o2);
      this.store.dispatch(action);
    };

    dispatchAddNode('xod/core/button', 100, 100);
    dispatchAddNode('xod/core/pot', 400, 100);
    dispatchAddNode('xod/core/led', 100, 400);
    dispatchAddNode('xod/core/servo', 400, 400);

    dispatchAddLink(
      { nodeId: nodes[0], pinKey: 'state' },
      { nodeId: nodes[2], pinKey: 'brightness' }
    );
  }

  createReducers(patches, reducers) {
    this.patches = patches;
    const patchIds = R.keys(this.patches);
    return generateReducers(patchIds, reducers);
  }

  render() {
    return (
      <Provider store={this.store}>
        <div>
          {this.props.children}
          {DevTools}
        </div>
      </Provider>
    );
  }
}

Root.propTypes = {
  children: React.PropTypes.element.isRequired,
  extraReducers: React.PropTypes.object,
};
