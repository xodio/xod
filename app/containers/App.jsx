
import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as Actions from '../actions';
import Selectors from '../selectors';
import { getViewableSize, isChromeApp } from '../utils/browser';

import Editor from './Editor';
import SnackBar from './SnackBar';
import Toolbar from './Toolbar';
import SkyLight from 'react-skylight';
import EventListener from 'react-event-listener';

import DevTools from './DevTools';
const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      size: getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
    };

    this.onResize = this.onResize.bind(this);
    this.onUpload = this.onUpload.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.onSave = this.onSave.bind(this);

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
    const isChromeApp = window.chrome && chrome.app && chrome.app.runtime;
    if (isChromeApp) {
      this.props.actions.upload();
    } else {
      this.suggestToInstallApplication();
    }
  }

  onLoad(json) {
    this.props.actions.loadProjectFromJSON();
  }

  onSave() {
    const projectJSON = this.props.projectJSON;
    const url = `data:text/json;charset=utf8,${encodeURIComponent(projectJSON)}`;
    window.open(url, '_blank');
    window.focus();
  }

  suggestToInstallApplication() {
    this.refs.suggestToInstallApplication.show();
  }

  render() {
    const devToolsInstrument = (isChromeApp) ? <DevTools /> : null;

    return (
      <div>
        <EventListener target={window} onResize={this.onResize} />
        <Toolbar
          meta={this.props.meta}
          onUpload={this.onUpload}
          onLoad={this.onLoad}
          onSave={this.onSave}
        />
        <Editor size={this.state.size} />
        <SnackBar />
        {devToolsInstrument}
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

const mapStateToProps = (state) => ({
  projectJSON: Selectors.Project.getJSON(state),
  meta: Selectors.Project.getMeta(state),

});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    upload: Actions.upload,
    loadProjectFromJSON: Actions.loadProjectFromJSON,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
