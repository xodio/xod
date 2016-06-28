import R from 'ramda';
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import Reducers from '../reducers/';
import { getViewableSize } from '../utils/browser';
import { EditorMiddleware } from '../middlewares';
import Serializer from '../serializers/mock';
import Editor from './Editor';
import EventListener from 'react-event-listener';

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.serializer = new Serializer();
    const initialState = this.serializer.getState();

    this.store = createStore(Reducers, initialState, EditorMiddleware);
    this.state = {
      size: getViewableSize(800, 600),
    };

    this.onResize = this.onResize.bind(this);
  }

  onResize() {
    this.setState(
      R.set(
        R.lensProp('size'),
        getViewableSize(800, 600),
        this.state
      )
    );
  }

  render() {
    return (
      <div>
        <EventListener target={window} onResize={this.onResize} />
        <Provider store={this.store}>
          <Editor size={this.state.size} />
        </Provider>
      </div>
    );
  }
}
