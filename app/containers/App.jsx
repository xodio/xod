
import R from 'ramda';
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import Reducers from '../reducers/';
import { getViewableSize } from '../utils/browser';
import { EditorMiddleware } from '../middlewares';
import * as Actions from '../actions';
import Serializer from '../serializers/mock';
import Editor from './Editor';
import SnackBar from './SnackBar';
import Toolbar from './Toolbar';
import EventListener from 'react-event-listener';
import SkyLight from 'react-skylight';

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
    this.onUpload = this.onUpload.bind(this);
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

  onUpload() {
    const isChromeApplication = window.chrome && chrome.app && chrome.app.runtime;
    if (isChromeApplication) {
      this.store.dispatch(Actions.upload());
    } else {
      this.suggestToInstallApplication();
    }
  }

  suggestToInstallApplication() {
    this.refs.suggestToInstallApplication.show();
  }

  render() {
    return (
      <div>
        <EventListener target={window} onResize={this.onResize} />
        <Provider store={this.store}>
          <div>
            <Toolbar onUpload={this.onUpload} />
            <Editor size={this.state.size} />
            <SnackBar />
          </div>
        </Provider>
        <SkyLight
          dialogStyles={{
            height: 'auto',
          }}
          ref="suggestToInstallApplication"
          title="Oops! You need a Chrome App!"
        >
          <p>
            To use this feature you have to install a Chrome Application.<br />
            It's free.
          </p>
          <p>
            <a href="#">Open in Chrome Store</a>
          </p>
        </SkyLight>
      </div>
    );
  }
}
