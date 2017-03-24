/* eslint-disable react/forbid-prop-types */

import fs from 'fs';
import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';
import EventListener from 'react-event-listener';

import core from 'xod-core';
import client from 'xod-client';

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

// TODO: tweak webpack config to allow importing built-in electron package
const { app, dialog, Menu } = window.require('electron').remote;

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

class App extends client.App {
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
    this.onShowCodeArduino = this.onShowCodeArduino.bind(this);
    this.onImportClicked = this.onImportClicked.bind(this);
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

    this.initNativeMenu();
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

  onImportClicked() {
    dialog.showOpenDialog(
      {
        properties: ['openFile'],
        filters: [
          { name: 'xodball', extensions: ['xodball'] },
        ],
      },
      (filePaths) => {
        if (!filePaths) return;

        fs.readFile(filePaths[0], 'utf8', (err, data) => {
          if (err) {
            this.props.actions.addError(err.message);
          }

          this.onImport(data);
        });
      }
    );
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
      this.props.actions.addError(errorMessage);
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

  onCloseApp() { // eslint-disable-line class-methods-use-this
    if (this.props.hasChanges) {
      // TODO: Add confirmation popup to prevent closing with unsaved changes
      //       'You have not saved changes in your project. Are you sure want to close app?'
    }

    return true;
  }

  getSaveProgress() {
    if (this.props.saveProcess && this.props.saveProcess.progress) {
      return this.props.saveProcess.progress;
    }

    return 0;
  }

  getMenuBarItems() {
    const {
      items,
      onClick,
      submenu,
    } = client.menu;

    return [
      submenu(
        items.file,
        [
          onClick(items.newProject, this.showPopupCreateProject),
          onClick(items.openProject, this.onOpenProjectClicked),
          onClick(items.saveProject, this.onSaveProject),
          onClick(items.renameProject, this.props.actions.requestRenameProject),
          onClick(items.selectWorkspace, this.showPopupSetWorkspace),
          items.separator,
          onClick(items.importProject, this.onImportClicked),
          onClick(items.exportProject, this.onExport),
          items.separator,
          onClick(items.newPatch, this.props.actions.createPatch),
          onClick(items.savePatch, this.onSavePatch),
        ]
      ),
      submenu(
        items.edit,
        [
          onClick(items.undo, this.props.actions.undoCurrentPatch),
          onClick(items.redo, this.props.actions.redoCurrentPatch),
        ]
      ),
      submenu(
        items.deploy,
        [
          onClick(items.showCodeForEspruino, this.onShowCodeEspruino),
          onClick(items.uploadToEspruino, this.onUpload),
          items.separator,
          onClick(items.showCodeForNodeJS, this.onShowCodeNodejs),
          items.separator,
          onClick(items.showCodeForArduino, this.onShowCodeArduino),
        ]
      ),
    ];
  }

  getKeyMap() { // eslint-disable-line class-methods-use-this
    const commandsBoundToNativeMenu = R.compose(
      R.reject(R.isNil),
      R.map(R.prop('command')),
      R.values
    )(client.menu.items);

    return R.omit(commandsBoundToNativeMenu, client.HOTKEY);
  }

  initNativeMenu() {
    const template = this.getMenuBarItems();

    // Browser controls
    template.push({
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    });

    if (process.platform === 'darwin') {
      // on a mac the first menu always has to be like this
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services', submenu: [] },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      });

      template.push({
        role: 'window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
        ],
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
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
      <HotKeys keyMap={this.getKeyMap()} id="App">
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
    requestRenameProject: client.requestRenameProject,
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
