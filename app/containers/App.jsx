
import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as Actions from '../actions';
import Selectors from '../selectors';
import { getViewableSize, isChromeApp } from '../utils/browser';
import * as EDITOR_MODE from '../constants/editorModes';

import Editor from './Editor';
import SnackBar from './SnackBar';
import Toolbar from '../components/Toolbar';
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
    this.onSelectNodeType = this.onSelectNodeType.bind(this);
    this.onAddNodeClick = this.onAddNodeClick.bind(this);
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
    if (isChromeApp) {
      this.props.actions.upload();
    } else {
      this.suggestToInstallApplication();
    }
  }

  onLoad(json) {
    this.props.actions.loadProjectFromJSON(json);
  }

  onSave() {
    const projectJSON = this.props.projectJSON;
    const url = `data:text/json;charset=utf8,${encodeURIComponent(projectJSON)}`;
    window.open(url, '_blank');
    window.focus();
  }

  onSelectNodeType(typeId) {
    this.props.actions.setSelectedNodeType(
      parseInt(typeId, 10)
    );
  }

  onAddNodeClick() {
    this.props.actions.setMode(EDITOR_MODE.CREATING_NODE);
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
          nodeTypes={this.props.nodeTypes}
          onUpload={this.onUpload}
          onLoad={this.onLoad}
          onSave={this.onSave}
          onSelectNodeType={this.onSelectNodeType}
          onAddNodeClick={this.onAddNodeClick}
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

App.propTypes = {
  projectJSON: React.PropTypes.string,
  meta: React.PropTypes.object,
  nodeTypes: React.PropTypes.any.isRequired,
  selectedNodeType: React.PropTypes.number,
  actions: React.PropTypes.object,
};

const mapStateToProps = (state) => ({
  projectJSON: Selectors.Project.getJSON(state),
  meta: Selectors.Project.getMeta(state),
  nodeTypes: Selectors.NodeType.getNodeTypes(state),
  selectedNodeType: Selectors.Editor.getSelectedNodeType(state),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    upload: Actions.upload,
    loadProjectFromJSON: Actions.loadProjectFromJSON,
    setMode: Actions.setMode,
    setSelectedNodeType: Actions.setSelectedNodeType,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
