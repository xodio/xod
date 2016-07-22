
import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as Actions from '../actions';
import Selectors from '../selectors';
import { getViewableSize, isChromeApp } from '../utils/browser';
import * as EDITOR_MODE from '../constants/editorModes';
import { SAVE_LOAD_ERRORS } from '../constants/errorMessages';

import Editor from './Editor';
import SnackBar from './SnackBar';
import Toolbar from '../components/Toolbar';
import PopupInstallApp from '../components/PopupInstallApp';
import EventListener from 'react-event-listener';

import DevTools from './DevTools';
const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      size: getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
      popupInstallApp: false,
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
    let project;
    let validJSON = true;
    let errorMessage = null;

    try {
      project = JSON.parse(json);
    } catch (err) {
      validJSON = false;
      errorMessage = SAVE_LOAD_ERRORS.NOT_A_JSON;
    }

    if (
      validJSON && typeof project === 'object' &&
      !(
        project.hasOwnProperty('nodes') &&
        project.hasOwnProperty('links') &&
        project.hasOwnProperty('pins') &&
        project.hasOwnProperty('patches') &&
        project.hasOwnProperty('nodeTypes') &&
        project.hasOwnProperty('meta')
      )
    ) {
      errorMessage = SAVE_LOAD_ERRORS.INVALID_FORMAT;
    }

    if (errorMessage) {
      this.props.actions.addError({
        message: errorMessage,
      });
      return;
    }

    this.props.actions.loadProjectFromJSON(json);
  }

  onSave() {
    const projectName = this.props.meta.name;
    const link = (document) ? document.createElement('a') : null;
    const url = `data:application/xod;charset=utf8,${encodeURIComponent(this.props.projectJSON)}`;

    if (link && link.download !== undefined) {
      link.href = url;
      link.setAttribute('download', `${projectName}.xod`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(url, '_blank');
      window.focus();
    }
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
    this.setState(
      R.assoc('popupInstallApp', true, this.state)
    );
  }

  render() {
    const devToolsInstrument = (isChromeApp) ? <DevTools /> : null;
    console.log('?', this.state.popupInstallApp);
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
        <PopupInstallApp isVisible={this.state.popupInstallApp} />
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
    addError: Actions.addError,
    setSelectedNodeType: Actions.setSelectedNodeType,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
