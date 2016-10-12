import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { HotKeys } from 'react-hotkeys';
import EventListener from 'react-event-listener';

import core from 'xod-core';
import client from 'xod-client';
import { transpile } from 'xod-espruino';
import { savePatch, saveProject } from '../actions';
import { SAVE_PROJECT } from '../actionTypes';
import PopupSetWorkspace from '../../settings/components/PopupSetWorkspace';
import { getSettings, getWorkspace } from '../../settings/selectors';
import { setWorkspace } from '../../settings/actions';
import SaveProgressBar from '../components/SaveProgressBar';

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
      popupCreateProject: false,
      code: '',
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onUpload = this.onUpload.bind(this);
    this.onShowCode = this.onShowCode.bind(this);
    this.onImport = this.onImport.bind(this);
    this.onExport = this.onExport.bind(this);
    this.onSavePatch = this.onSavePatch.bind(this);
    this.onSaveProject = this.onSaveProject.bind(this);
    this.onSelectNodeType = this.onSelectNodeType.bind(this);
    this.onAddNodeClick = this.onAddNodeClick.bind(this);
    this.onUploadPopupClose = this.onUploadPopupClose.bind(this);
    this.onCloseApp = this.onCloseApp.bind(this);
    this.onWorkspaceChange = this.onWorkspaceChange.bind(this);
    this.onCreateProject = this.onCreateProject.bind(this);

    this.hideInstallAppPopup = this.hideInstallAppPopup.bind(this);
    this.hideCodePopup = this.hideCodePopup.bind(this);
    this.showPopupSetWorkspace = this.showPopupSetWorkspace.bind(this);
    this.hidePopupSetWorkspace = this.hidePopupSetWorkspace.bind(this);
    this.showPopupCreateProject = this.showPopupCreateProject.bind(this);
    this.hidePopupCreateProject = this.hidePopupCreateProject.bind(this);
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

  onCreateProject(projectName) {
    this.props.actions.createProject(projectName);
    this.hidePopupCreateProject();
    this.onSaveProject();
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

  onSavePatch() {
    // 1. Check for existing of workspace
    //    if does not exists — show PopupSetWorkspace
    if (!this.props.workspace) {
      this.showPopupSetWorkspace(this.onSavePatch);
    } else {
      // 2. Save!
      this.props.actions.savePatch({
        json: this.props.projectJSON,
        patchId: this.props.currentPatchId,
      });
    }
  }

  onSaveProject() {
    // 1. Check for existing of workspace
    //    if does not exists — show PopupSetWorkspace
    if (!this.props.workspace) {
      this.showPopupSetWorkspace(this.onSaveProject);
    } else {
      // 2. Save!
      this.props.actions.saveProject({
        json: this.props.projectJSON
      });
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

  getSaveProgress() {
    if (this.props.saveProcess && this.props.saveProcess.percentage) {
      return this.props.saveProcess.percentage;
    }

    return 0;
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
        key: 'saveProject',
        className: 'save-button',
        label: 'Save project',
        onClick: this.onSaveProject,
      },
      {
        key: 'savePatch',
        className: 'save-button',
        label: 'Save current patch',
        onClick: this.onSavePatch,
      },
      {
        key: 'switchWorkspace',
        className: 'save-button',
        label: 'Workspace dir',
        onClick: this.showPopupSetWorkspace,
      },
      {
        key: 'newProject',
        className: 'upload-button',
        label: 'Create new project',
        onClick: this.showPopupCreateProject,
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

  showPopupCreateProject() {
    this.setState({ popupCreateProject: true });
  }

  hidePopupCreateProject() {
    this.setState({ popupCreateProject: false });
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
        <client.PopupPrompt
          title="Create new project"
          confirmText="Create project"
          isVisible={this.state.popupCreateProject}
          onConfirm={this.onCreateProject}
          onClose={this.hidePopupCreateProject}
        >
          <p>
          Please, give a sonorous name to yor project:
          </p>
        </client.PopupPrompt>
        <PopupSetWorkspace
          workspace={this.props.workspace}
          isVisible={this.state.popupSetWorkspace}
          onChange={this.onWorkspaceChange}
          onClose={this.hidePopupSetWorkspace}
        />
        <SaveProgressBar percentage={this.getSaveProgress()} />
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
  saveProcess: React.PropTypes.object,
  currentPatchId: React.PropTypes.string,
};

const mapStateToProps = (state) => {
  const processes = client.getProccesses(state);
  const settings = getSettings(state);

  return ({
    hasChanges: client.projectHasChanges(state),
    project: core.getProject(state),
    projectJSON: core.getProjectJSON(state),
    meta: core.getMeta(state),
    nodeTypes: core.dereferencedNodeTypes(state),
    selectedNodeType: client.getSelectedNodeType(state),
    upload: client.getUpload(state),
    workspace: getWorkspace(settings),
    saveProcess: client.findProcessByType(SAVE_PROJECT)(processes),
    currentPatchId: client.getCurrentPatchId(state),
  });
};

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    createProject: client.createProject,
    upload: client.upload,
    loadProjectFromJSON: client.loadProjectFromJSON,
    setMode: client.setMode,
    savePatch,
    saveProject,
    addError: client.addError,
    setSelectedNodeType: client.setSelectedNodeType,
    deleteProcess: client.deleteProcess,
    setWorkspace: setWorkspace,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
