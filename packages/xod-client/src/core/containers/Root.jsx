import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import DevTools from '../../utils/devtools';
import generateReducers from '../reducer';
import initialState from '../state';
import EditorMiddleware from '../middlewares';
import { addNode, addLink } from '../actions';

export default class Root extends React.Component {

  constructor(props) {
    super(props);

    this.store = createStore(
      generateReducers(this.props.extraReducers),
      initialState,
      EditorMiddleware
    );
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

    dispatchAddNode('xod/core/button', 138, 120);
    dispatchAddNode('xod/core/pot', 394, 120);
    dispatchAddNode('xod/core/led', 138, 432);
    dispatchAddNode('xod/core/servo', 394, 432);

    dispatchAddLink(
      { nodeId: nodes[0], pinKey: 'state' },
      { nodeId: nodes[2], pinKey: 'brightness' }
    );
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
