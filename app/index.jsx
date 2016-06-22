/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import App from './containers/App';
import { Editor, Project, NodeTypes } from './reducers/';
import initialState from './state';

const Stores = {
  Project: createStore(Project),
  Editor: createStore(Editor),
  NodeTypes: createStore(NodeTypes),
};

const projectName = initialState.project.name;

ReactDOM.render(
  <App
    name={projectName}
    project={Stores.Project.getState()}
    {...Stores.Editor.getState()}
    {...Stores.NodeTypes.getState()}
  />,
  document.getElementById('root')
);
