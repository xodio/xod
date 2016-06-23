import React from 'react';
import R from 'ramda';
import Patch from '../containers/Patch';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { Editor, Project, NodeTypes } from '../reducers/';
import initialState from '../state';
import { getViewableSize } from '../utils/browser';

const projectName = initialState.project.name;
const Stores = {
  Project: createStore(Project),
  Editor: createStore(Editor),
  NodeTypes: createStore(NodeTypes),
};

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.canvasSize = getViewableSize(800, 600);
  }

  render() {
    const editorMode = Stores.Editor.getState().mode || 'edit';

    return (
      <div>
        <h1>{projectName}</h1>

        <Provider store={Stores.Project}>
          <Patch editorMode={editorMode} size={this.canvasSize} />
        </Provider>
      </div>
    );
  }
}