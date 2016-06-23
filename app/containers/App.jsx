import React from 'react';
import R from 'ramda';
import PatchContainer from '../containers/PatchContainer';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import Reducers from '../reducers/';
import { getViewableSize } from '../utils/browser';

import Serializer from '../serializers/mock';

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.serializer = new Serializer();

    const initialState = this.serializer.getState();

    this.store = createStore(Reducers, initialState);
    this.canvasSize = getViewableSize(800, 600);
  }

  render() {
    const state = this.store.getState();

    console.log(state);

    const projectName = state.project.name;
    const editorMode = state.editor.mode || 'edit';

    return (
      <div>
        <h1>{projectName}</h1>

        <Provider store={this.store}>
          <PatchContainer editorMode={editorMode} size={this.canvasSize} />
        </Provider>
      </div>
    );
  }
}