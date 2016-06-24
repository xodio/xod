import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import Reducers from '../reducers/';
import { getViewableSize } from '../utils/browser';
import { EditorMiddleware } from '../middlewares';
import Serializer from '../serializers/mock';
import Editor from './Editor';

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.serializer = new Serializer();
    const initialState = this.serializer.getState();

    this.store = createStore(Reducers, initialState, EditorMiddleware);

    this.canvasSize = getViewableSize(800, 600);
  }

  render() {
    return (
      <Provider store={this.store}>
        <Editor size={this.canvasSize} />
      </Provider>
    );
  }
}
