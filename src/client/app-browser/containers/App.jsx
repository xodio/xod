
import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { HotKeys } from 'react-hotkeys';

import * as Actions from '../actions';
import { UPLOAD as UPLOAD_ACTION_TYPE } from '../actionTypes';
import Selectors from '../selectors';
import { getViewableSize, isChromeApp } from 'xod/client/utils/browser';
import { SAVE_LOAD_ERRORS } from 'xod/client/messages/constants';
import { KEYCODE, HOTKEY } from 'xod/client/utils/constants';

import { constants as EDITOR_CONST, container as Editor } from 'xod/client/editor';
import SnackBar from 'xod/client/messages/containers/SnackBar';
import Toolbar from '../components/Toolbar';
import PopupInstallApp from '../components/PopupInstallApp';
import PopupUploadProject from 'xod/client/processes/components/PopupUploadProject';
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
      popupUploadProject: false,
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onUpload = this.onUpload.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onSelectNodeType = this.onSelectNodeType.bind(this);
    this.onAddNodeClick = this.onAddNodeClick.bind(this);
    this.onUploadPopupClose = this.onUploadPopupClose.bind(this);
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
      this.showUploadProgressPopup();
      this.props.actions.upload();
    } else {
      this.showInstallAppPopup();
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

    if (validJSON && !Selectors.Project.validateProject(project)) {
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

  onSelectNodeType(typeKey) {
    this.props.actions.setSelectedNodeType(typeKey);
  }

  onAddNodeClick() {
    this.props.actions.setMode(EDITOR_CONST.EDITOR_MODE.CREATING_NODE);
  }

  onUploadPopupClose(id) {
    this.hideUploadProgressPopup();
    this.props.actions.deleteProcess(id, UPLOAD_ACTION_TYPE);
  }

  onKeyDown(event) {
    const keyCode = event.keyCode || event.which;

    if (keyCode === KEYCODE.BACKSPACE) {
      event.preventDefault();
    }

    return false;
  }

  showInstallAppPopup() {
    this.setState(
      R.assoc('popupInstallApp', true, this.state)
    );
  }

  showUploadProgressPopup() {
    this.setState(
      R.assoc('popupUploadProject', true, this.state)
    );
  }

  hideUploadProgressPopup() {
    this.setState(
      R.assoc('popupUploadProject', false, this.state)
    );
  }

  render() {
    const devToolsInstrument = (isChromeApp) ? <DevTools /> : null;
    return (
      <HotKeys keyMap={HOTKEY} id="App">
        <EventListener target={window} onResize={this.onResize} onKeyDown={this.onKeyDown} />
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
        <PopupInstallApp
          isVisible={this.state.popupInstallApp}
        />
        <PopupUploadProject
          isVisible={this.state.popupUploadProject}
          upload={this.props.upload}
          onClose={this.onUploadPopupClose}
        />
      </HotKeys>
    );
  }
}

App.propTypes = {
  projectJSON: React.PropTypes.string,
  meta: React.PropTypes.object,
  nodeTypes: React.PropTypes.any.isRequired,
  selectedNodeType: React.PropTypes.string,
  actions: React.PropTypes.object,
  upload: React.PropTypes.object,
};

const mapStateToProps = (state) => ({
  projectJSON: Selectors.Project.getProjectJSON(state),
  meta: Selectors.Project.getMeta(state),
  nodeTypes: Selectors.Project.dereferencedNodeTypes(state),
  selectedNodeType: Selectors.Editor.getSelectedNodeType(state),
  upload: Selectors.Processes.getUpload(state),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    upload: Actions.upload,
    loadProjectFromJSON: Actions.loadProjectFromJSON,
    setMode: Actions.setMode,
    addError: Actions.addError,
    setSelectedNodeType: Actions.setSelectedNodeType,
    deleteProcess: Actions.deleteProcess,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
