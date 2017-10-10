/* eslint-disable react/forbid-prop-types */

import fs from 'fs';
import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';
import EventListener from 'react-event-listener';
import isDevelopment from 'electron-is-dev';
import { ipcRenderer, remote as remoteElectron, shell } from 'electron';

import client from 'xod-client';
import { Project } from 'xod-project';
import { foldEither } from 'xod-func-tools';
import { transpile, getNodeIdsMap } from 'xod-arduino';

import packageJson from '../../../package.json';

import * as actions from '../actions';
import * as uploadActions from '../../upload/actions';
import * as debuggerIPC from '../../debugger/ipcActions';
import { getUploadProcess, getSelectedSerialPort } from '../../upload/selectors';
import * as settingsActions from '../../settings/actions';
import { SAVE_PROJECT } from '../actionTypes';
import { UPLOAD, UPLOAD_TO_ARDUINO } from '../../upload/actionTypes';
import PopupSetWorkspace from '../../settings/components/PopupSetWorkspace';
import PopupCreateWorkspace from '../../settings/components/PopupCreateWorkspace';
import PopupProjectSelection from '../../projects/components/PopupProjectSelection';
import PopupUploadProject from '../../upload/components/PopupUploadProject';
import PopupUploadConfig from '../../upload/components/PopupUploadConfig';
import { REDUCER_STATUS } from '../../projects/constants';
import { SaveProgressBar } from '../components/SaveProgressBar';

import formatError from '../../shared/errorFormatter';
import * as EVENTS from '../../shared/events';
import * as MESSAGES from '../../shared/messages';
import { createSystemMessage } from '../../shared/debuggerMessages';

import { subscribeAutoUpdaterEvents, downloadUpdate } from '../autoupdate';
import { subscribeToTriggerMainMenuRequests } from '../../testUtils/triggerMainMenu';

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

const defaultState = {
  size: client.getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
  workspace: '',
  downloadProgressPopup: false,
  downloadProgressPopupError: null,
};

class App extends client.App {
  constructor(props) {
    super(props);

    this.state = R.clone(defaultState);

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);

    this.listBoards = this.listBoards.bind(this);
    this.listPorts = this.listPorts.bind(this);
    this.getSelectedBoard = this.getSelectedBoard.bind(this);

    this.onClickMessageButton = this.onClickMessageButton.bind(this);

    this.onUploadToArduinoClicked = this.onUploadToArduinoClicked.bind(this);
    this.onUploadToArduino = this.onUploadToArduino.bind(this);
    this.onArduinoTargetBoardChange = this.onArduinoTargetBoardChange.bind(this);
    this.onSerialPortChange = this.onSerialPortChange.bind(this);
    this.onShowCodeArduino = this.onShowCodeArduino.bind(this);
    this.onImportClicked = this.onImportClicked.bind(this);
    this.onImport = this.onImport.bind(this);
    this.onExport = this.onExport.bind(this);
    this.onSaveProject = this.onSaveProject.bind(this);
    this.onOpenProjectClicked = this.onOpenProjectClicked.bind(this);

    this.onUploadPopupClose = this.onUploadPopupClose.bind(this);
    this.onUploadConfigClose = this.onUploadConfigClose.bind(this);
    this.onCloseApp = this.onCloseApp.bind(this);
    this.onWorkspaceChange = this.onWorkspaceChange.bind(this);
    this.onWorkspaceCreate = this.onWorkspaceCreate.bind(this);
    this.onCreateProject = this.onCreateProject.bind(this);

    this.onLoadProject = this.onLoadProject.bind(this);
    this.onSelectProject = this.onSelectProject.bind(this);
    this.onArduinoPathChange = this.onArduinoPathChange.bind(this);

    this.hideAllPopups = this.hideAllPopups.bind(this);
    this.showPopupProjectSelection = this.showPopupProjectSelection.bind(this);
    this.showPopupSetWorkspace = this.showPopupSetWorkspace.bind(this);
    this.showPopupSetWorkspaceNotCancellable = this.showPopupSetWorkspaceNotCancellable.bind(this);
    this.showCreateWorkspacePopup = this.showCreateWorkspacePopup.bind(this);

    this.initNativeMenu();

    // Reactions on messages from Main Process
    ipcRenderer.on(
      EVENTS.UPDATE_WORKSPACE,
      (event, workspacePath) => this.setState({ workspace: workspacePath })
    );
    ipcRenderer.on(
      EVENTS.REQUEST_SELECT_PROJECT,
      (event, data) => this.showPopupProjectSelection(data)
    );
    ipcRenderer.on(
      EVENTS.REQUEST_SHOW_PROJECT,
      (event, project) => this.onLoadProject(project)
    );
    ipcRenderer.on(
      EVENTS.REQUEST_CREATE_WORKSPACE,
      (event, { path, force }) => this.showCreateWorkspacePopup(path, force)
    );
    ipcRenderer.on(
      EVENTS.WORKSPACE_ERROR,
      (event, error) => {
        // TODO: Catch CANT_OPEN_SELECTED_PROJECT and show something else
        //       (its strange to ask to switch workspace if project has broken).
        this.showPopupSetWorkspaceNotCancellable();
        console.error(error); // eslint-disable-line no-console
        this.props.actions.addError(formatError(error));
      }
    );

    // Debugger
    debuggerIPC.subscribeOnDebuggerEvents(ipcRenderer, this);

    // autoUpdater
    subscribeAutoUpdaterEvents(ipcRenderer, this);
  }

  onClickMessageButton(buttonId, /* messageInfo */) {
    if (buttonId === 'downloadAndInstall') {
      downloadUpdate(ipcRenderer);
      this.setState(R.assoc('downloadProgressPopup', true));
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

  onUploadToArduinoClicked() {
    this.props.actions.uploadToArduinoConfig();
  }

  onUploadToArduino(board, port, cloud, debug, processActions = null) {
    const proc = (processActions !== null) ? processActions : this.props.actions.uploadToArduino();
    const eitherTProject = this.transformProjectForTranspiler(debug);
    const eitherCode = eitherTProject.map(transpile);

    const errored = foldEither(
      (error) => {
        proc.fail(error.message, 0);
        return 1;
      },
      (code) => {
        ipcRenderer.send(UPLOAD_TO_ARDUINO, {
          code,
          cloud,
          board,
          port,
        });
        return 0;
      },
      eitherCode
    );

    if (errored) return;

    ipcRenderer.on(UPLOAD_TO_ARDUINO, (event, payload) => {
      if (payload.progress) {
        proc.progress(payload.message, payload.percentage);
        return;
      }
      if (payload.success) {
        proc.success(payload.message);
        if (debug) {
          foldEither(
            error => this.props.actions.addError(error.message),
            (nodeIdsMap) => {
              this.props.actions.startDebuggerSession(
                createSystemMessage('Debug session started'),
                nodeIdsMap,
                this.props.currentPatchPath
              );
              debuggerIPC.sendStartDebuggerSession(ipcRenderer, port);
            },
            R.map(getNodeIdsMap, eitherTProject)
          );
        }
      }
      if (payload.failure) {
        console.error(payload.error); // eslint-disable-line no-console
        const failureMessage = R.compose(
          R.join('\n\n'),
          R.reject(R.isNil)
        )([payload.message, payload.error.stdout, payload.stderr]);
        proc.fail(failureMessage, payload.percentage);
      }
      // Remove listener if process is finished.
      ipcRenderer.removeAllListeners(UPLOAD_TO_ARDUINO);
    });
  }

  onCreateProject(projectName) {
    this.props.actions.createProject(projectName);
    ipcRenderer.send(EVENTS.CREATE_PROJECT, projectName);
    ipcRenderer.once(EVENTS.SAVE_PROJECT, () => {
      this.props.actions.addConfirmation(MESSAGES.PROJECT_SAVE_SUCCEED);
    });
  }

  onOpenProjectClicked() {
    ipcRenderer.send(EVENTS.OPEN_PROJECT);
    this.showPopupProjectSelection();
  }

  onSelectProject(projectMeta) { // eslint-disable-line
    ipcRenderer.send(EVENTS.SELECT_PROJECT, projectMeta);
  }

  onLoadProject(project) {
    this.props.actions.openProject(project);
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
    this.props.actions.switchWorkspace(val);
    ipcRenderer.send(EVENTS.SWITCH_WORKSPACE, val);
  }

  onWorkspaceCreate(path) {
    this.props.actions.createWorkspace(path);
    ipcRenderer.send(EVENTS.CREATE_WORKSPACE, path);
  }

  onSaveProject() {
    this.props.actions.saveProject(this.props.project);
  }

  onUploadPopupClose(id) {
    this.props.actions.deleteProcess(id, UPLOAD);
  }

  onUploadConfigClose() {
    this.props.actions.hideUploadConfigPopup();
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
        if (payload.code === 0) this.hideAllPopups();
      }
    );
  }

  onArduinoTargetBoardChange(board) { // eslint-disable-line
    ipcRenderer.send(EVENTS.SET_SELECTED_BOARD, board);
  }

  onSerialPortChange(port) {
    this.props.actions.selectSerialPort(port);
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
          onClick(items.newProject, this.props.actions.requestCreateProject),
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
          items.separator,
          onClick(items.insertNode, () => this.props.actions.showSuggester(null)),
          onClick(items.insertComment, this.props.actions.addComment),
          items.separator,
          onClick(items.projectPreferences, this.props.actions.showProjectPreferences),
        ]
      ),
      submenu(
        items.deploy,
        [
          onClick(items.showCodeForArduino, this.onShowCodeArduino),
          onClick(items.uploadToArduino, this.onUploadToArduinoClicked),
        ]
      ),
      submenu(
        items.help,
        [
          {
            key: 'version',
            enabled: false,
            label: `Version: ${packageJson.version}`,
          },
          items.separator,
          onClick(items.documentation, () => {
            shell.openExternal(client.getUtmSiteUrl('/docs/', 'docs', 'menu'));
          }),
          onClick(items.shortcuts, () => {
            shell.openExternal(client.getUtmSiteUrl('/docs/guide/shortcuts/', 'docs', 'menu'));
          }),
          onClick(items.forum, () => {
            shell.openExternal(client.getUtmForumUrl('menu'));
          }),
        ]
      ),
    ];
  }

  getKeyMap() { // eslint-disable-line class-methods-use-this
    const commandsBoundToNativeMenu = R.compose(
      R.reject(R.either(
        R.isNil,
        R.pipe(R.prop(R.__, client.ELECTRON_ACCELERATOR), R.isNil)
      )),
      R.map(R.prop('command')),
      R.values
    )(client.menu.items);

    return R.omit(commandsBoundToNativeMenu, client.HOTKEY);
  }

  getSelectedBoard() { // eslint-disable-line
    return new Promise((resolve, reject) => {
      ipcRenderer.send(EVENTS.GET_SELECTED_BOARD);
      ipcRenderer.once(EVENTS.GET_SELECTED_BOARD, (event, response) => {
        if (response.err) { reject(response.data); }
        resolve(response.data);
      });
    });
  }

  initNativeMenu() {
    const viewMenu = {
      label: 'View',
      submenu: [
        client.menu.onClick(client.menu.items.toggleHelpbar, this.props.actions.toggleHelpbar),
        client.menu.onClick(client.menu.items.toggleDebugger, this.props.actions.toggleDebugger),
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    };

    const template = this.getMenuBarItems();
    const helpItem = R.last(template);

    R.compose(
      (finalTemplate) => {
        const menu = Menu.buildFromTemplate(finalTemplate);
        Menu.setApplicationMenu(menu);
        // for testing purposes
        // see https://github.com/electron/spectron/issues/21
        if (isDevelopment) {
          subscribeToTriggerMainMenuRequests(ipcRenderer, finalTemplate);
        }
      },
      R.append(helpItem),
      R.when(
        () => process.platform === 'darwin',
        R.compose(
          R.prepend({
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
          }),
          R.append({
            role: 'window',
            submenu: [
              { role: 'minimize' },
              { role: 'close' },
            ],
          })
        )
      ),
      R.append(viewMenu),
      R.init // get rid of help menu, we'll reappend it later
    )(template);
  }

  showPopupProjectSelection(projects) {
    const data = projects ? {
      status: REDUCER_STATUS.LOADED,
      list: projects,
    } : {
      status: REDUCER_STATUS.PENDING,
    };

    this.props.actions.requestOpenProject(data);
  }

  showPopupSetWorkspace() {
    this.props.actions.requestSwitchWorkspace({ disposable: false });
  }

  showPopupSetWorkspaceNotCancellable() {
    this.props.actions.requestSwitchWorkspace({ disposable: true });
  }

  showCreateWorkspacePopup(path, force) {
    this.props.actions.requestCreateWorkspace(path, force);
  }

  hideAllPopups() {
    this.props.actions.hideAllPopups();
  }

  listBoards() { // eslint-disable-line
    return new Promise((resolve, reject) => {
      ipcRenderer.send(EVENTS.LIST_BOARDS);
      ipcRenderer.once(EVENTS.LIST_BOARDS, (event, response) => {
        if (response.err) { reject(response.data); }
        resolve(response.data);
      });
    });
  }
  listPorts() { // eslint-disable-line
    return new Promise((resolve, reject) => {
      ipcRenderer.send(EVENTS.LIST_PORTS);
      ipcRenderer.once(EVENTS.LIST_PORTS, (event, response) => {
        if (response.err) { reject(response.data); }
        resolve(response.data);
      });
    });
  }

  renderPopupUploadConfig() {
    return (this.props.popups.uploadToArduinoConfig) ? (
      <PopupUploadConfig
        isVisible
        getSelectedBoard={this.getSelectedBoard}
        selectedPort={this.props.selectedPort}
        listBoards={this.listBoards}
        listPorts={this.listPorts}
        onBoardChanged={this.onArduinoTargetBoardChange}
        onPortChanged={this.onSerialPortChange}
        onUpload={this.onUploadToArduino}
        onClose={this.onUploadConfigClose}
      />
    ) : null;
  }
  renderPopupUploadProcess() {
    return (this.props.popups.uploadProject) ? (
      <PopupUploadProject
        isVisible
        upload={this.props.upload}
        onClose={this.onUploadPopupClose}
      />
    ) : null;
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
        <client.Editor
          size={this.state.size}
          stopDebuggerSession={() => debuggerIPC.sendStopDebuggerSession(ipcRenderer)}
        />
        <client.SnackBar
          onClickMessageButton={this.onClickMessageButton}
        />
        {this.renderPopupShowCode()}
        {this.renderPopupUploadConfig()}
        {this.renderPopupUploadProcess()}
        {this.renderPopupProjectPreferences()}
        {this.renderPopupCreateNewProject()}
        <PopupSetWorkspace
          workspace={this.state.workspace}
          isClosable={R.propOr(false, 'disposable', this.props.popupsData.switchWorkspace)}
          isVisible={this.props.popups.switchWorkspace}
          onChange={this.onWorkspaceChange}
          onClose={this.hideAllPopups}
        />
        <PopupProjectSelection
          projects={this.props.popupsData.projectSelection}
          isVisible={this.props.popups.projectSelection}
          onSelect={this.onSelectProject}
          onClose={this.hideAllPopups}
          onSwitchWorkspace={this.showPopupSetWorkspace}
          onCreateNewProject={this.props.actions.requestCreateProject}
        />
        <PopupCreateWorkspace
          data={this.props.popupsData.createWorkspace}
          isVisible={this.props.popups.createWorkspace}
          onCreateWorkspace={this.onWorkspaceCreate}
          onClose={this.showPopupSetWorkspaceNotCancellable}
        />
        {/* TODO: Refactor this mess: */}
        {(this.state.downloadProgressPopup) ? (
          <client.PopupAlert
            title="Downloading update for XOD IDE"
            closeText="Close"
            onClose={() => {
              this.setState(R.assoc('downloadProgressPopup', false));
              this.setState(R.assoc('downloadProgressPopupError', null));
            }}
            isClosable={this.state.downloadProgressPopupError}
          >
            {(this.state.downloadProgressPopupError) ? (
              <div>
                <p>
                  Error occured during downloading or installing the update.<br />
                  Please report the bug on our <a href="https://forum.xod.io/" rel="noopener noreferrer">forum</a>.
                </p>
                <pre>
                  {this.state.downloadProgressPopupError}
                </pre>
              </div>
            ) : (
              <div>
                <p>
                  Downloading of the update for XOD IDE is in progress.
                </p>
                <p>
                  After download, we will automatically install it and
                  relaunch the application.<br />
                  It could take up for few minutes.
                </p>
                <p>
                  Keep calm and brew a tea.
                </p>
              </div>
            )}
          </client.PopupAlert>
        ) : null}
        <SaveProgressBar progress={this.getSaveProgress()} />
      </HotKeys>
    );
  }
}

App.propTypes = R.merge(client.App.propTypes, {
  hasChanges: PropTypes.bool,
  projects: PropTypes.object,
  project: client.sanctuaryPropType(Project),
  actions: PropTypes.objectOf(PropTypes.func),
  upload: PropTypes.object,
  workspace: PropTypes.string,
  selectedPort: PropTypes.object,
});

const getSaveProcess = R.compose(
  client.findProcessByType(SAVE_PROJECT),
  client.getProccesses
);

const mapStateToProps = R.applySpec({
  hasChanges: client.projectHasChanges,
  project: client.getProject,
  upload: getUploadProcess,
  saveProcess: getSaveProcess,
  currentPatchPath: client.getCurrentPatchPath,
  selectedPort: getSelectedSerialPort,
  popups: {
    createProject: client.getPopupVisibility(client.POPUP_ID.CREATING_PROJECT),
    projectSelection: client.getPopupVisibility(client.POPUP_ID.OPENING_PROJECT),
    switchWorkspace: client.getPopupVisibility(client.POPUP_ID.SWITCHING_WORKSPACE),
    createWorkspace: client.getPopupVisibility(client.POPUP_ID.CREATING_WORKSPACE),
    uploadToArduinoConfig: client.getPopupVisibility(client.POPUP_ID.UPLOADING_CONFIG),
    uploadProject: client.getPopupVisibility(client.POPUP_ID.UPLOADING),
    showCode: client.getPopupVisibility(client.POPUP_ID.SHOWING_CODE),
    projectPreferences: client.getPopupVisibility(
      client.POPUP_ID.EDITING_PROJECT_PREFERENCES
    ),
  },
  popupsData: {
    projectSelection: client.getPopupData(client.POPUP_ID.OPENING_PROJECT),
    createWorkspace: client.getPopupData(client.POPUP_ID.CREATING_WORKSPACE),
    switchWorkspace: client.getPopupData(client.POPUP_ID.SWITCHING_WORKSPACE),
    showCode: client.getPopupData(client.POPUP_ID.SHOWING_CODE),
  },
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    R.merge(client.App.actions, {
      requestOpenProject: client.requestOpenProject,
      requestSwitchWorkspace: settingsActions.requestSwitchWorkspace,
      requestCreateWorkspace: settingsActions.requestCreateWorkspace,
      createWorkspace: settingsActions.createWorkspace,
      switchWorkspace: settingsActions.switchWorkspace,
      openProject: client.openProject,
      saveProject: actions.saveProject,
      uploadToArduino: uploadActions.uploadToArduino,
      uploadToArduinoConfig: uploadActions.uploadToArduinoConfig,
      hideUploadConfigPopup: uploadActions.hideUploadConfigPopup,
      selectSerialPort: uploadActions.selectSerialPort,
    }), dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
