/* eslint-disable react/forbid-prop-types */

import fs from 'fs';
import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';
import EventListener from 'react-event-listener';
import { ipcRenderer, remote as remoteElectron } from 'electron';

import client from 'xod-client';
import {
  getProjectName,
  getProjectAuthors,
  isValidIdentifier,
  IDENTIFIER_RULES,
} from 'xod-project';

import * as actions from '../actions';
import * as uploadActions from '../../upload/actions';
import { getUploadProcess } from '../../upload/selectors';
import { SAVE_PROJECT } from '../actionTypes';
import { UPLOAD, UPLOAD_TO_ARDUINO } from '../../upload/actionTypes';
import PopupSetWorkspace from '../../settings/components/PopupSetWorkspace';
import PopupSetArduinoIDEPath from '../../settings/components/PopupSetArduinoIDEPath';
import PopupProjectSelection from '../../projects/components/PopupProjectSelection';
import PopupUploadProject from '../../upload/components/PopupUploadProject';
import { getProjects } from '../../projects/selectors';
import { getSettings, getWorkspace } from '../../settings/selectors';
import { changeWorkspace, checkWorkspace } from '../../settings/actions';
import { SaveProgressBar } from '../components/SaveProgressBar';

import { IDE_NOT_FOUND } from '../../shared/errorCodes';

const { app, dialog, Menu } = remoteElectron;
const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

const onContextMenu = (event) => {
  event.preventDefault();
  event.stopPropagation();

  const { items } = client.menu;
  const InputMenu = Menu.buildFromTemplate([
    items.cut,
    items.copy,
    items.paste,
  ]);

  const node = event.target;
  const isEditable = (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable);
  const isEnabled = !node.disabled;
  if (isEditable && isEnabled) { InputMenu.popup(remoteElectron.getCurrentWindow()); }
};

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
      popupArduinoNotFound: false,
      code: '',
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);

    this.onUpload = this.onUpload.bind(this);
    this.onUploadToArduino = this.onUploadToArduino.bind(this);
    this.onShowCodeEspruino = this.onShowCodeEspruino.bind(this);
    this.onShowCodeNodejs = this.onShowCodeNodejs.bind(this);
    this.onShowCodeArduino = this.onShowCodeArduino.bind(this);
    this.onImportClicked = this.onImportClicked.bind(this);
    this.onImport = this.onImport.bind(this);
    this.onExport = this.onExport.bind(this);
    this.onSaveProject = this.onSaveProject.bind(this);
    this.onOpenProjectClicked = this.onOpenProjectClicked.bind(this);

    this.onAddNodeClick = this.onAddNodeClick.bind(this);
    this.onUploadPopupClose = this.onUploadPopupClose.bind(this);
    this.onCloseApp = this.onCloseApp.bind(this);
    this.onWorkspaceChange = this.onWorkspaceChange.bind(this);
    this.onCreateProject = this.onCreateProject.bind(this);
    this.showPopupSetWorkspace = this.showPopupSetWorkspace.bind(this);
    this.showPopupCreateProject = this.showPopupCreateProject.bind(this);

    this.onOpenProject = this.onOpenProject.bind(this);
    this.onArduinoPathChange = this.onArduinoPathChange.bind(this);

    this.hideCodePopup = this.hideCodePopup.bind(this);
    this.hidePopupSetWorkspace = this.hidePopupSetWorkspace.bind(this);
    this.hidePopupCreateProject = this.hidePopupCreateProject.bind(this);
    this.showPopupProjectSelection = this.showPopupProjectSelection.bind(this);
    this.hidePopupProjectSelection = this.hidePopupProjectSelection.bind(this);

    this.showArduinoIdeNotFoundPopup = this.showArduinoIdeNotFoundPopup.bind(this);
    this.hideArduinoIdeNotFoundPopup = this.hideArduinoIdeNotFoundPopup.bind(this);

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

  onUploadToArduino(pab, processActions = null) {
    const { project, currentPatchPath } = this.props;
    const proc = (processActions !== null) ? processActions : this.props.actions.uploadToArduino();

    this.showUploadProgressPopup();
    ipcRenderer.send(UPLOAD_TO_ARDUINO, {
      pab,
      project,
      patchPath: currentPatchPath,
    });
    ipcRenderer.on(UPLOAD_TO_ARDUINO, (event, payload) => {
      if (payload.progress) {
        proc.progress(payload.message, payload.percentage);
        return;
      }
      if (payload.success) {
        proc.success(payload.message);
      }
      if (payload.failure) {
        if (payload.errorCode === IDE_NOT_FOUND) {
          this.hideUploadProgressPopup();
          this.showArduinoIdeNotFoundPopup();
          ipcRenderer.once('SET_ARDUINO_IDE',
            (evt, response) => {
              if (response.code === 0) this.onUploadToArduino(pab, proc);
            }
          );
        }
        proc.fail(payload.message);
      }
      // Remove listener if process is finished.
      ipcRenderer.removeAllListeners(UPLOAD_TO_ARDUINO);
    });
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

  onWorkspaceChange(val) {
    this.hidePopupSetWorkspace();
    this.props.actions.changeWorkspace({ path: val });

    if (typeof this.state.popupSetWorkspaceCB === 'function') {
      this.state.popupSetWorkspaceCB();
      this.setState({ popupSetWorkspaceCB: null });
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
        project: this.props.project,
      });
    }
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

  onArduinoPathChange(newPath) {
    ipcRenderer.send('SET_ARDUINO_IDE', { path: newPath });
    ipcRenderer.once('SET_ARDUINO_IDE',
      (event, payload) => {
        if (payload.code === 0) this.hideArduinoIdeNotFoundPopup();
      }
    );
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
        ]
      ),
      submenu(
        items.edit,
        [
          onClick(items.undo, this.props.actions.undoCurrentPatch),
          onClick(items.redo, this.props.actions.redoCurrentPatch),
          items.separator,
          items.cut,
          items.copy,
          items.paste,
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
          // TODO: Remove this hardcode and do a magic in the xod-arduino-builder
          onClick(items.uploadToArduinoUno, () => this.onUploadToArduino(
            {
              package: 'arduino',
              architecture: 'avr',
              board: 'uno',
            }
          )),
          onClick(items.uploadToArduinoLeonardo, () => this.onUploadToArduino(
            {
              package: 'arduino',
              architecture: 'avr',
              board: 'leonardo',
            }
          )),
          onClick(items.uploadToArduinoM0, () => this.onUploadToArduino(
            {
              package: 'arduino',
              architecture: 'samd',
              board: 'mzero_bl',
            }
          )),
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

  showArduinoIdeNotFoundPopup() {
    this.setState({ popupArduinoNotFound: true });
  }

  hideArduinoIdeNotFoundPopup() {
    this.setState({ popupArduinoNotFound: false });
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
      <HotKeys keyMap={this.getKeyMap()} id="App" onContextMenu={onContextMenu}>
        <EventListener
          target={window}
          onResize={this.onResize}
          onKeyDown={this.onKeyDown}
          onBeforeUnload={this.onCloseApp}
        />
        <client.Toolbar
          projectName={getProjectName(this.props.project)}
          projectAuthors={getProjectAuthors(this.props.project)}
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
          inputMask={client.lowercaseKebabMask}
          inputValidator={isValidIdentifier}
          helpText={IDENTIFIER_RULES}
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
        <PopupSetArduinoIDEPath
          isVisible={this.state.popupArduinoNotFound}
          onChange={this.onArduinoPathChange}
          onClose={this.hideArduinoIdeNotFoundPopup}
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

App.propTypes = R.merge(client.App.propTypes, {
  hasChanges: React.PropTypes.bool,
  projects: React.PropTypes.object,
  actions: React.PropTypes.objectOf(React.PropTypes.func),
  upload: React.PropTypes.object,
  workspace: React.PropTypes.string,
  saveProcess: React.PropTypes.object,
});

const mapStateToProps = (state) => {
  const processes = client.getProccesses(state);
  const settings = getSettings(state);

  return ({
    hasChanges: client.projectHasChanges(state),
    projects: getProjects(state),
    project: client.getProject(state),
    upload: getUploadProcess(state),
    workspace: getWorkspace(settings),
    saveProcess: client.findProcessByType(SAVE_PROJECT)(processes),
    currentPatchPath: client.getCurrentPatchPath(state),
  });
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    createProject: client.createProject,
    requestRenameProject: client.requestRenameProject,
    setMode: client.setMode,
    saveProject: actions.saveProject,
    loadProjectList: actions.loadProjectList,
    loadProject: actions.loadProject,
    importProject: client.importProject, // used in base App class
    upload: uploadActions.upload,
    uploadToArduino: uploadActions.uploadToArduino,
    addError: client.addError,
    deleteProcess: client.deleteProcess,
    createPatch: client.requestCreatePatch,
    undoCurrentPatch: client.undoCurrentPatch,
    redoCurrentPatch: client.redoCurrentPatch,
    checkWorkspace,
    changeWorkspace,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
