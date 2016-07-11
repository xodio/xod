import R from 'ramda';
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import Reducers from '../reducers/';
import { getViewableSize } from '../utils/browser';
import { EditorMiddleware } from '../middlewares';
import Serializer from '../serializers/mock';
import Editor from './Editor';
import SnackBar from './SnackBar';
import EventListener from 'react-event-listener';

// DevTools via component is's a temporary feature, that makes some lags.
// I hope developers of DevToolsExtension will fix bug and then we'll return to it.
// Issue: https://github.com/zalmoxisus/redux-devtools-extension/issues/165
import DevTools from './DevTools';

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.serializer = new Serializer();
    const initialState = this.serializer.getState();

    this.store = createStore(Reducers, initialState, EditorMiddleware);
    this.state = {
      size: getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
    };

    this.onResize = this.onResize.bind(this);
  }

  onResize() {
    this.setState(
      R.set(
        R.lensProp('size'),
        getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
        this.state
      )
    );
  }

  render() {
    return (
      <div>
        <EventListener target={window} onResize={this.onResize} />
        <Provider store={this.store}>
          <div>
            <Editor size={this.state.size} />
            <SnackBar />
            <DevTools />
          </div>
        </Provider>
      </div>
    );
  }
}
