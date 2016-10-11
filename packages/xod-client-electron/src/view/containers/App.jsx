import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { HotKeys } from 'react-hotkeys';
import EventListener from 'react-event-listener';

import core from 'xod-core';
import client from 'xod-client';
import { transpile } from 'xod-espruino';
import { saveProject } from '../actions';
import PopupSetWorkspace from '../../settings/components/PopupSetWorkspace';
import { getWorkspace } from '../../settings/selectors';
import { setWorkspace } from '../../settings/actions';

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      size: client.getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
      popupInstallApp: false,
      popupUploadProject: false,
      popupShowCode: false,
      popupSetWorkspace: false,
      popupSetWorkspaceCB: null,
      code: '',
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onUpload = this.onUpload.bind(this);
    this.onShowCode = this.onShowCode.bind(this);
    this.onImport = this.onImport.bind(this);
    this.onExport = this.onExport.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onSelectNodeType = this.onSelectNodeType.bind(this);
    this.onAddNodeClick = this.onAddNodeClick.bind(this);
    this.onUploadPopupClose = this.onUploadPopupClose.bind(this);
    this.onCloseApp = this.onCloseApp.bind(this);
    this.onWorkspaceChange = this.onWorkspaceChange.bind(this);

    this.hideInstallAppPopup = this.hideInstallAppPopup.bind(this);
    this.hideCodePopup = this.hideCodePopup.bind(this);
    this.showPopupSetWorkspace = this.showPopupSetWorkspace.bind(this);
    this.hidePopupSetWorkspace = this.hidePopupSetWorkspace.bind(this);
  }

  onResize() {
    this.setState(
      R.set(
        R.lensProp('size'),
        client.getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
        this.state
      )
    );
  }

  onUpload() {
    this.showUploadProgressPopup();
    this.props.actions.upload();
  }

  onShowCode() {
    this.setState({
      code: transpile(this.props.project),
    });
    this.showCodePopup();
  }

  onImport(json) {
    let project;
    let validJSON = true;
    let errorMessage = null;

    try {
      project = JSON.parse(json);
    } catch (err) {
      validJSON = false;
      errorMessage = client.SAVE_LOAD_ERRORS.NOT_A_JSON;
    }

    if (validJSON && !core.validateProject(project)) {
      errorMessage = client.SAVE_LOAD_ERRORS.INVALID_FORMAT;
    }

    if (errorMessage) {
      this.props.actions.addError({
        message: errorMessage,
      });
      return;
    }

    this.props.actions.loadProjectFromJSON(json);
  }

  onExport() {
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

  onWorkspaceChange(val) {
    this.hidePopupSetWorkspace();
    this.props.actions.setWorkspace(val);

    if (typeof this.state.popupSetWorkspaceCB === 'function') {
      this.state.popupSetWorkspaceCB();
      this.setState({ popupSetWorkspaceCB: null });
    }
  }

  onSave() {
    // 1. Check for existing of workspace
    //    if does not exists — show PopupSetWorkspace
    if (!this.props.workspace) {
      this.showPopupSetWorkspace(this.onSave);
    } else {
      // 2. Save!
      this.props.actions.saveProject(this.props.projectJSON);
    }
  }

  onSelectNodeType(typeKey) {
    this.props.actions.setSelectedNodeType(typeKey);
  }

  onAddNodeClick() {
    this.props.actions.setMode(client.EDITOR_MODE.CREATING_NODE);
  }

  onUploadPopupClose(id) {
    this.hideUploadProgressPopup();
    this.props.actions.deleteProcess(id, client.UPLOAD);
  }

  onKeyDown(event) {
    const keyCode = event.keyCode || event.which;

    if (!client.isInputTarget(event) && keyCode === client.KEYCODE.BACKSPACE) {
      event.preventDefault();
    }

    return false;
  }

  onElectronClose() {
    // @TODO
    return true;
  }

  onBrowserClose(event) {
    let message = true;

    if (this.props.hasChanges) {
      message = 'You have not saved changes in your project. Are you sure want to close app?';
      if (event) { event.returnValue = message; } // eslint-disable-line
    }

    return message;
  }

  onCloseApp(event) {
    return this.onElectronClose(event);
  }

  getToolbarLoadElement() {
    return (
      <label
        key="import"
        className="load-button"
      >
        <input
          type="file"
          accept=".xod"
          onChange={this.onImport}
        />
        <span>
          Import project
        </span>
      </label>
    );
  }

  getToolbarButtons() {
    return [
      {
        key: 'upload',
        className: 'upload-button',
        label: 'Upload',
        onClick: this.onUpload,
      },
      {
        key: 'show-code',
        className: 'show-code-button',
        label: 'Show code',
        onClick: this.onShowCode,
      },
      {
        key: 'export',
        className: 'save-button',
        label: 'Export project',
        onClick: this.onExport,
      },
      this.getToolbarLoadElement(),
      {
        key: 'save',
        className: 'save-button',
        label: 'Save project',
        onClick: this.onSave,
      },
      {
        key: 'switchWorkspace',
        className: 'save-button',
        label: 'Workspace dir',
        onClick: this.showPopupSetWorkspace,
      },
    ];
  }

  showInstallAppPopup() {
    this.setState({ popupInstallApp: true });
  }

  hideInstallAppPopup() {
    this.setState({ popupInstallApp: false });
  }

  showUploadProgressPopup() {
    this.setState({ popupUploadProject: true });
  }

  hideUploadProgressPopup() {
    this.setState({ popupUploadProject: false });
  }

  showCodePopup() {
    this.setState({ popupShowCode: true });
  }

  hideCodePopup() {
    this.setState({ popupShowCode: false });
  }

  showPopupSetWorkspace(cb) {
    this.setState({ popupSetWorkspace: true });
    if (cb) {
      this.setState({ popupSetWorkspaceCB: cb });
    }
  }

  hidePopupSetWorkspace() {
    this.setState({ popupSetWorkspace: false });
  }

  render() {
    return (
      <HotKeys keyMap={client.HOTKEY} id="App">
        <EventListener
          target={window}
          onResize={this.onResize}
          onKeyDown={this.onKeyDown}
          onBeforeUnload={this.onCloseApp}
        />
        <client.Toolbar
          meta={this.props.meta}
          nodeTypes={this.props.nodeTypes}
          onSelectNodeType={this.onSelectNodeType}
          onAddNodeClick={this.onAddNodeClick}
          buttons={this.getToolbarButtons()}
        />
        <client.Editor size={this.state.size} />
        <client.SnackBar />
        <client.PopupShowCode
          isVisible={this.state.popupShowCode}
          code={this.state.code}
          onClose={this.hideCodePopup}
        />
        <client.PopupUploadProject
          isVisible={this.state.popupUploadProject}
          upload={this.props.upload}
          onClose={this.onUploadPopupClose}
        />
        <PopupSetWorkspace
          workspace={this.props.workspace}
          isVisible={this.state.popupSetWorkspace}
          onChange={this.onWorkspaceChange}
          onClose={this.hidePopupSetWorkspace}
        />
      </HotKeys>
    );
  }
}

App.propTypes = {
  hasChanges: React.PropTypes.bool,
  project: React.PropTypes.object,
  projectJSON: React.PropTypes.string,
  meta: React.PropTypes.object,
  nodeTypes: React.PropTypes.any.isRequired,
  selectedNodeType: React.PropTypes.string,
  actions: React.PropTypes.objectOf(React.PropTypes.func),
  upload: React.PropTypes.object,
  workspace: React.PropTypes.string,
};

const mapStateToProps = (state) => ({
  hasChanges: client.projectHasChanges(state),
  project: core.getProject(state),
  projectJSON: core.getProjectJSON(state),
  meta: core.getMeta(state),
  nodeTypes: core.dereferencedNodeTypes(state),
  selectedNodeType: client.getSelectedNodeType(state),
  upload: client.getUpload(state),
  workspace: getWorkspace(state.settings),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    upload: client.upload,
    loadProjectFromJSON: client.loadProjectFromJSON,
    setMode: client.setMode,
    saveProject,
    addError: client.addError,
    setSelectedNodeType: client.setSelectedNodeType,
    deleteProcess: client.deleteProcess,
    setWorkspace: setWorkspace,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
