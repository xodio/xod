/* eslint-disable react/forbid-prop-types */

import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';
import EventListener from 'react-event-listener';

import core from 'xod-core';
import client from 'xod-client';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';

import * as actions from '../actions';
import * as uploadActions from '../../upload/actions';
import { getUploadProcess } from '../../upload/selectors';
import { SAVE_PROJECT } from '../actionTypes';
import { UPLOAD } from '../../upload/actionTypes';
import PopupSetWorkspace from '../../settings/components/PopupSetWorkspace';
import PopupProjectSelection from '../../projects/components/PopupProjectSelection';
import PopupUploadProject from '../../upload/components/PopupUploadProject';
import { getProjects } from '../../projects/selectors';
import { getSettings, getWorkspace } from '../../settings/selectors';
import { changeWorkspace, checkWorkspace } from '../../settings/actions';
import { SaveProgressBar } from '../components/SaveProgressBar';

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      size: client.getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
      popupUploadProject: false,
      popupShowCode: false,
      popupSetWorkspace: false,
      popupSetWorkspaceCB: null,
      popupCreateProject: false,
      popupProjectSelection: false,
      code: '',
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);

    this.onUpload = this.onUpload.bind(this);
    this.onShowCodeEspruino = this.onShowCodeEspruino.bind(this);
    this.onShowCodeNodejs = this.onShowCodeNodejs.bind(this);
    // TODO: refactor to use electron's native features?
    this.onImportChange = this.onImportChange.bind(this);
    this.onImport = this.onImport.bind(this);
    this.onExport = this.onExport.bind(this);
    this.onSavePatch = this.onSavePatch.bind(this);
    this.onSaveProject = this.onSaveProject.bind(this);
    this.onOpenProjectClicked = this.onOpenProjectClicked.bind(this);

    this.onSelectNodeType = this.onSelectNodeType.bind(this);
    this.onAddNodeClick = this.onAddNodeClick.bind(this);
    this.onUploadPopupClose = this.onUploadPopupClose.bind(this);
    this.onCloseApp = this.onCloseApp.bind(this);
    this.onWorkspaceChange = this.onWorkspaceChange.bind(this);
    this.onCreateProject = this.onCreateProject.bind(this);
    this.showPopupSetWorkspace = this.showPopupSetWorkspace.bind(this);
    this.showPopupCreateProject = this.showPopupCreateProject.bind(this);

    this.onOpenProject = this.onOpenProject.bind(this);

    this.hideCodePopup = this.hideCodePopup.bind(this);
    this.hidePopupSetWorkspace = this.hidePopupSetWorkspace.bind(this);
    this.hidePopupCreateProject = this.hidePopupCreateProject.bind(this);
    this.showPopupProjectSelection = this.showPopupProjectSelection.bind(this);
    this.hidePopupProjectSelection = this.hidePopupProjectSelection.bind(this);
  }

  componentDidMount() {
    this.props.actions.checkWorkspace({ path: this.props.workspace });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.workspace !== nextProps.workspace && nextProps.workspace === null) {
      this.showPopupSetWorkspace(this.hidePopupSetWorkspace);
    }
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

  onShowCodeEspruino() {
    this.setState({
      code: transpileForEspruino(this.props.project),
    });
    this.showCodePopup();
  }

  onShowCodeNodejs() {
    this.setState({
      code: transpileForNodeJS(this.props.project),
    });
    this.showCodePopup();
  }

  onOpenProjectClicked() {
    // 1. Check for existing of workspace
    //    if does not exists — show PopupSetWorkspace
    if (!this.props.workspace) {
      this.showPopupSetWorkspace(this.onOpenProjectClicked);
    } else {
      // 2. Dispatch action that loads project list
      this.props.actions.loadProjectList();
      // 3. Show project selection popup, that will show loading and then show project list
      this.showPopupProjectSelection();
    }
  }

  onOpenProject(path) {
    this.props.actions.loadProject({ path });
    this.hidePopupProjectSelection();
  }

  onImportChange(event) {
    const file = event.target.files[0];
    const reader = new window.FileReader();

    reader.onload = (e) => {
      this.onImport(e.target.result);
    };

    reader.readAsText(file);
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
      link.setAttribute('download', `${projectName}.xodball`);

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
    this.props.actions.changeWorkspace({ path: val });

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
        json: this.props.projectJSON,
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
    this.props.actions.deleteProcess(id, UPLOAD);
  }

  onKeyDown(event) { // eslint-disable-line class-methods-use-this
    const keyCode = event.keyCode || event.which;

    if (!client.isInputTarget(event) && keyCode === client.KEYCODE.BACKSPACE) {
      event.preventDefault();
    }

    return false;
  }

  onCloseApp(event) { // eslint-disable-line class-methods-use-this
    let message = true;

    if (this.props.hasChanges) {
      message = 'You have not saved changes in your project. Are you sure want to close app?';
      if (event) { event.returnValue = message; } // eslint-disable-line
    }

    return message;
  }

  getSaveProgress() {
    if (this.props.saveProcess && this.props.saveProcess.progress) {
      return this.props.saveProcess.progress;
    }

    return 0;
  }

  getMenuBarItems() {
    return [
      {
        key: 'File',
        label: 'File',
        submenu: [
          {
            key: 'New_Project',
            label: 'New Project',
            click: this.showPopupCreateProject,
          },
          {
            key: 'openProject',
            label: 'Open Project',
            click: this.onOpenProjectClicked,
          },
          {
            key: 'saveProject',
            label: 'Save Project',
            click: this.onSaveProject,
          },
          {
            key: 'switchWorkspace',
            label: 'Select Workspace',
            click: this.showPopupSetWorkspace,
          },
          {
            key: 'file_sep1',
            type: 'separator',
          },
          {
            key: 'Import_Project',
            children: (
              <label
                key="import"
                className="load-button"
                htmlFor="importButton"
              >
                <input
                  type="file"
                  accept=".xodball"
                  onChange={this.onImportChange}
                  id="importButton"
                />
                <span>
                  Import project
                </span>
              </label>
            ),
          },
          {
            key: 'Export_Project',
            label: 'Export Project',
            click: this.onExport,
          },
          {
            key: 'file_sep2',
            type: 'separator',
          },
          {
            key: 'New_Patch',
            label: 'New Patch',
            click: this.props.actions.createPatch,
            // TODO: is it okay to manually merge configs like this?
            hotkey: client.HOTKEY[client.COMMAND.ADD_PATCH],
          },
          {
            key: 'savePatch',
            label: 'Save current patch',
            click: this.onSavePatch,
          },
        ],
      },
      {
        key: 'Edit',
        label: 'Edit',
        submenu: [
          {
            key: 'Undo',
            label: 'Undo',
            click: this.props.actions.undoCurrentPatch,
            hotkey: client.HOTKEY[client.COMMAND.UNDO],
          },
          {
            key: 'Redo',
            label: 'Redo',
            click: this.props.actions.redoCurrentPatch,
            hotkey: client.HOTKEY[client.COMMAND.REDO],
          },
        ],
      },
      {
        key: 'Deploy',
        label: 'Deploy',
        submenu: [
          {
            key: 'Show Code for Espruino',
            label: 'Show Code for Espruino',
            click: this.onShowCodeEspruino,
          },
          {
            key: 'Upload to Espruino',
            label: 'Upload to Espruino',
            click: this.onUpload,
          },
          {
            key: 'deploy_sep',
            type: 'separator',
          },
          {
            key: 'Show Code for NodeJS',
            label: 'Show Code for NodeJS',
            click: this.onShowCodeNodejs,
          },
        ],
      },
    ];
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

  showPopupProjectSelection() {
    this.setState({ popupProjectSelection: true });
  }

  hidePopupProjectSelection() {
    this.setState({ popupProjectSelection: false });
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
          selectedNodeType={this.props.selectedNodeType}
          onSelectNodeType={this.onSelectNodeType}
          onAddNodeClick={this.onAddNodeClick}
          menuBarItems={this.getMenuBarItems()}
        />
        <client.Editor size={this.state.size} />
        <client.SnackBar />
        <client.PopupShowCode
          isVisible={this.state.popupShowCode}
          code={this.state.code}
          onClose={this.hideCodePopup}
        />
        <PopupUploadProject
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
          Please, give a sonorous name to your project:
          </p>
        </client.PopupPrompt>
        <PopupSetWorkspace
          workspace={this.props.workspace}
          isVisible={this.state.popupSetWorkspace}
          onChange={this.onWorkspaceChange}
          onClose={this.hidePopupSetWorkspace}
        />
        <PopupProjectSelection
          projects={this.props.projects}
          isVisible={this.state.popupProjectSelection}
          onSelect={this.onOpenProject}
          onClose={this.hidePopupProjectSelection}
        />
        <SaveProgressBar progress={this.getSaveProgress()} />
      </HotKeys>
    );
  }
}

App.propTypes = {
  hasChanges: React.PropTypes.bool,
  project: React.PropTypes.object,
  projects: React.PropTypes.object,
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
    project: core.getProjectPojo(state),
    projects: getProjects(state),
    projectJSON: core.getProjectJSON(state),
    meta: core.getMeta(state),
    nodeTypes: core.dereferencedNodeTypes(state),
    selectedNodeType: client.getSelectedNodeType(state),
    upload: getUploadProcess(state),
    workspace: getWorkspace(settings),
    saveProcess: client.findProcessByType(SAVE_PROJECT)(processes),
    currentPatchId: client.getCurrentPatchId(state),
  });
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    createProject: client.createProject,
    loadProjectFromJSON: client.loadProjectFromJSON,
    setMode: client.setMode,
    savePatch: actions.savePatch,
    saveProject: actions.saveProject,
    loadProjectList: actions.loadProjectList,
    loadProject: actions.loadProject,
    upload: uploadActions.upload,
    addError: client.addError,
    setSelectedNodeType: client.setSelectedNodeType,
    deleteProcess: client.deleteProcess,
    createPatch: client.requestCreatePatch,
    undoCurrentPatch: client.undoCurrentPatch,
    redoCurrentPatch: client.redoCurrentPatch,
    checkWorkspace,
    changeWorkspace,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
