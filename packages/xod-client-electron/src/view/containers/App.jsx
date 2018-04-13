import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';
import EventListener from 'react-event-listener';
import isDevelopment from 'electron-is-dev';
import { ipcRenderer, remote as remoteElectron, shell } from 'electron';

import client from 'xod-client';
import { Project, getProjectName, messages as xpMessages } from 'xod-project';
import {
  foldEither,
  isAmong,
  explodeMaybe,
  noop,
  composeErrorFormatters,
} from 'xod-func-tools';
import { transpile, getNodeIdsMap } from 'xod-arduino';

import packageJson from '../../../package.json';

import * as actions from '../actions';
import * as uploadActions from '../../upload/actions';
import * as debuggerIPC from '../../debugger/ipcActions';
import {
  getUploadProcess,
  getSelectedSerialPort,
} from '../../upload/selectors';
import * as settingsActions from '../../settings/actions';
import { UPLOAD, UPLOAD_TO_ARDUINO } from '../../upload/actionTypes';
import PopupSetWorkspace from '../../settings/components/PopupSetWorkspace';
import PopupCreateWorkspace from '../../settings/components/PopupCreateWorkspace';
import PopupUploadConfig from '../../upload/components/PopupUploadConfig';
import { SaveProgressBar } from '../components/SaveProgressBar';

import formatError from '../../shared/errorFormatter';
import * as EVENTS from '../../shared/events';
import UPLOAD_MESSAGES from '../../upload/messages';
import { createSystemMessage } from '../../shared/debuggerMessages';

import { subscribeAutoUpdaterEvents } from '../autoupdate';
import subscribeToTriggerMainMenuRequests from '../../testUtils/triggerMainMenu';
import { TRIGGER_SAVE_AS, TRIGGER_LOAD_PROJECT } from '../../testUtils/events';

import {
  getOpenDialogFileFilters,
  createSaveDialogOptions,
} from '../nativeDialogs';
import { STATES, getEventNameWithState } from '../../shared/eventStates';

const { app, dialog, Menu } = remoteElectron;
const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

const formatErrorMessage = composeErrorFormatters([xpMessages]);

const defaultState = {
  size: client.getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
  workspace: '',
  projectPath: null,
  downloadProgressPopup: false,
  downloadProgressPopupError: null,
};

class App extends client.App {
  constructor(props) {
    super(props);

    this.state = R.clone(defaultState);

    this.onResize = this.onResize.bind(this);

    this.suggestProjectFilePath = this.suggestProjectFilePath.bind(this);

    this.onUploadToArduinoClicked = this.onUploadToArduinoClicked.bind(this);
    this.onUploadToArduinoAndDebugClicked = this.onUploadToArduinoAndDebugClicked.bind(
      this
    );
    this.onUploadToArduino = this.onUploadToArduino.bind(this);
    this.onSerialPortChange = this.onSerialPortChange.bind(this);
    this.onShowCodeArduino = this.onShowCodeArduino.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onSaveAs = this.onSaveAs.bind(this);
    this.onSaveCopyAs = this.onSaveCopyAs.bind(this);
    this.onOpenProjectClicked = this.onOpenProjectClicked.bind(this);
    this.onOpenTutorialProject = this.onOpenTutorialProject.bind(this);

    this.onUploadPopupClose = this.onUploadPopupClose.bind(this);
    this.onUploadConfigClose = this.onUploadConfigClose.bind(this);
    this.onWorkspaceChange = this.onWorkspaceChange.bind(this);
    this.onWorkspaceCreate = this.onWorkspaceCreate.bind(this);
    this.onCreateProject = this.onCreateProject.bind(this);

    this.onLoadProject = this.onLoadProject.bind(this);
    this.onArduinoPathChange = this.onArduinoPathChange.bind(this);

    this.hideAllPopups = this.hideAllPopups.bind(this);
    this.showPopupSetWorkspace = this.showPopupSetWorkspace.bind(this);
    this.showPopupSetWorkspaceNotCancellable = this.showPopupSetWorkspaceNotCancellable.bind(
      this
    );
    this.showCreateWorkspacePopup = this.showCreateWorkspacePopup.bind(this);

    this.initNativeMenu();

    // Reactions on messages from Main Process
    ipcRenderer.on(EVENTS.PROJECT_PATH_CHANGED, (event, projectPath) =>
      this.setState({ projectPath })
    );
    ipcRenderer.on(EVENTS.UPDATE_WORKSPACE, (event, workspacePath) =>
      this.setState({ workspace: workspacePath })
    );
    ipcRenderer.on(EVENTS.REQUEST_OPEN_PROJECT, (event, path) => {
      this.confirmUnsavedChanges(() =>
        ipcRenderer.send(EVENTS.CONFIRM_OPEN_PROJECT, path)
      );
    });
    ipcRenderer.on(EVENTS.REQUEST_SHOW_PROJECT, (event, project) =>
      this.onLoadProject(project)
    );
    ipcRenderer.on(EVENTS.REQUEST_CREATE_WORKSPACE, (event, { path, force }) =>
      this.showCreateWorkspacePopup(path, force)
    );
    ipcRenderer.on(EVENTS.WORKSPACE_ERROR, (event, error) => {
      // TODO: Catch CANT_OPEN_SELECTED_PROJECT and show something else
      //       (its strange to ask to switch workspace if project has broken).
      this.showPopupSetWorkspaceNotCancellable();
      console.error(error); // eslint-disable-line no-console
      this.props.actions.addError(formatError(error));
    });
    ipcRenderer.on(EVENTS.REQUEST_CLOSE_WINDOW, () => {
      this.confirmUnsavedChanges(() => {
        ipcRenderer.send(EVENTS.CONFIRM_CLOSE_WINDOW);
      });
    });
    ipcRenderer.on(EVENTS.INSTALL_LIBRARIES_FAILED, (event, error) => {
      console.error(error); // eslint-disable-line no-console
      this.props.actions.addError(formatError(error));
    });
    ipcRenderer.on(
      EVENTS.PAN_TO_CENTER,
      this.props.actions.setCurrentPatchOffsetToCenter
    );

    this.urlActions = {
      // actionPathName: params => this.props.actions.someAction(params.foo, params.bar),
      [client.URL_ACTION_TYPES.OPEN_TUTORIAL]: this.onOpenTutorialProject,
    };
    ipcRenderer.on(EVENTS.XOD_URL_CLICKED, (event, { actionName, params }) => {
      const action = this.urlActions[actionName];

      if (action) {
        action(params);
      } else {
        this.props.actions.addError(
          client.Messages.invalidUrlActionName(actionName)
        );
      }
    });

    // Debugger
    debuggerIPC.subscribeOnDebuggerEvents(ipcRenderer, this);

    // autoUpdater
    subscribeAutoUpdaterEvents(ipcRenderer, this);

    if (isDevelopment) {
      // Besause we can't control file dialogs in autotests
      ipcRenderer.on(TRIGGER_SAVE_AS, projectPath => {
        if (!projectPath) {
          throw new Error('Expected projectPath to be present');
        }

        this.saveAs(projectPath, true).catch(noop);
      });
      ipcRenderer.on(TRIGGER_LOAD_PROJECT, projectPath => {
        if (!projectPath) {
          throw new Error('Expected projectPath to be present');
        }
        ipcRenderer.send(EVENTS.LOAD_PROJECT, projectPath);
      });
    }

    // request for data from main process
    props.actions.fetchGrant();
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

  onUploadToArduinoAndDebugClicked() {
    this.props.actions.uploadToArduinoConfig(true);
  }

  onUploadToArduino(board, port, cloud, debug, processActions = null) {
    const proc =
      processActions !== null
        ? processActions
        : this.props.actions.uploadToArduino();
    const eitherTProject = this.transformProjectForTranspiler(debug);
    const eitherCode = eitherTProject.map(transpile);

    const errored = foldEither(
      error => {
        const stanza = formatErrorMessage(error);
        const messageForConsole = [
          ...(stanza.title ? [stanza.title] : []),
          ...(stanza.path ? [stanza.path.join(' -> ')] : []),
          ...(stanza.note ? [stanza.note] : []),
          ...(stanza.solution ? [stanza.solution] : []),
        ].join('\n');
        proc.fail(messageForConsole, 0);
        return 1;
      },
      code => {
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

        this.props.actions.addConfirmation({ title: UPLOAD_MESSAGES.SUCCESS });

        if (debug) {
          foldEither(
            error =>
              this.props.actions.addError(client.composeMessage(error.message)),
            nodeIdsMap => {
              if (this.props.currentPatchPath.isNothing) return;
              const currentPatchPath = explodeMaybe(
                'Imposible error: currentPatchPath is Nothing',
                this.props.currentPatchPath
              );

              this.props.actions.startDebuggerSession(
                createSystemMessage('Debug session started'),
                nodeIdsMap,
                currentPatchPath
              );
              debuggerIPC.sendStartDebuggerSession(ipcRenderer, port);
            },
            R.map(getNodeIdsMap, eitherTProject)
          );
        }
      }
      if (payload.failure) {
        console.error(payload.error); // eslint-disable-line no-console
        const failureMessage = R.compose(R.join('\n\n'), R.reject(R.isNil))([
          payload.message,
          payload.error.stdout,
          payload.stderr,
        ]);
        proc.fail(failureMessage, payload.percentage);
      }
      // Remove listener if process is finished.
      ipcRenderer.removeAllListeners(UPLOAD_TO_ARDUINO);
      this.props.actions.updateCompileLimit();
    });
  }

  onCreateProject() {
    this.confirmUnsavedChanges(() => {
      this.props.actions.createProject();
      ipcRenderer.send(EVENTS.CREATE_PROJECT);
    });
  }

  onOpenProjectClicked() {
    this.confirmUnsavedChanges(() => {
      dialog.showOpenDialog(
        {
          properties: ['openFile'],
          filters: getOpenDialogFileFilters(),
        },
        filePaths => {
          if (!filePaths) return;
          ipcRenderer.send(EVENTS.LOAD_PROJECT, filePaths[0]);
        }
      );
    });
  }

  // TODO: Do we still need it?
  static onSelectProject(projectMeta) {
    ipcRenderer.send(EVENTS.SELECT_PROJECT, projectMeta);
  }

  onOpenTutorialProject() {
    this.confirmUnsavedChanges(() => {
      ipcRenderer.send(EVENTS.OPEN_BUNDLED_PROJECT, 'welcome-to-xod');
    });
  }

  onLoadProject(project) {
    this.props.actions.openProject(project);
  }

  onWorkspaceChange(val) {
    this.confirmUnsavedChanges(() => {
      this.props.actions.switchWorkspace(val);
      ipcRenderer.send(EVENTS.SWITCH_WORKSPACE, val);
    });
  }

  onWorkspaceCreate(path) {
    this.props.actions.createWorkspace(path);
    ipcRenderer.send(EVENTS.CREATE_WORKSPACE, path);
  }

  onSave(onAfterSave = noop) {
    if (this.state.projectPath) {
      this.saveAs(this.state.projectPath, false)
        .then(onAfterSave)
        .catch(noop);
    } else {
      this.onSaveAs(onAfterSave);
    }
  }

  saveAs(filePath, shouldUpdateProjectPath) {
    return new Promise((resolve, reject) => {
      this.props.actions.saveAll({
        oldProject: this.props.lastSavedProject,
        newProject: this.props.project,
        projectPath: filePath,
        updateProjectPath: shouldUpdateProjectPath,
      });

      ipcRenderer.once(
        getEventNameWithState(EVENTS.SAVE_ALL, STATES.COMPLETE),
        (event, res) => resolve(res)
      );
      ipcRenderer.once(
        getEventNameWithState(EVENTS.SAVE_ALL, STATES.ERROR),
        (event, err) => reject(err)
      );
    });
  }

  onSaveAs(onAfterSave = noop) {
    dialog.showSaveDialog(
      createSaveDialogOptions(
        'Save As...',
        this.suggestProjectFilePath(),
        'Save'
      ),
      filePath => {
        if (!filePath) return;
        this.saveAs(filePath, true)
          .then(onAfterSave)
          .catch(noop);
      }
    );
  }
  onSaveCopyAs() {
    dialog.showSaveDialog(
      createSaveDialogOptions(
        'Save Copy As...',
        this.suggestProjectFilePath(),
        'Save a Copy'
      ),
      filePath => {
        if (!filePath) return;
        this.saveAs(filePath, false).catch(noop);
      }
    );
  }

  confirmUnsavedChanges(onConfirm) {
    if (!this.props.hasUnsavedChanges) {
      onConfirm();
      return;
    }

    const clickedButtonId = dialog.showMessageBox({
      message: 'Save changes to the current project before closing?',
      detail: 'If you don’t save the project, changes will be lost',
      type: 'warning',
      buttons: ['Save', 'Discard', 'Cancel'],
      cancelId: 2,
    });

    if (clickedButtonId === 0) {
      // Save
      this.onSave(onConfirm);
    } else if (clickedButtonId === 1) {
      // Discard
      onConfirm();
    }
  }

  onUploadPopupClose(id) {
    this.props.actions.deleteProcess(id, UPLOAD);
  }

  onUploadConfigClose() {
    this.props.actions.hideUploadConfigPopup();
  }

  static onKeyDown(event) {
    const keyCode = event.keyCode || event.which;

    if (!client.isInputTarget(event) && keyCode === client.KEYCODE.BACKSPACE) {
      event.preventDefault();
    }

    return false;
  }

  onArduinoPathChange(newPath) {
    ipcRenderer.send('SET_ARDUINO_IDE', { path: newPath });
    ipcRenderer.once('SET_ARDUINO_IDE', (event, payload) => {
      if (payload.code === 0) this.hideAllPopups();
    });
  }

  static onArduinoTargetBoardChange(board) {
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
    const { items, onClick, submenu } = client.menu;

    // macOS makes Quit item automatically
    const exitItems =
      process.platform === 'darwin'
        ? []
        : [
            items.separator,
            onClick(items.exit, () =>
              remoteElectron.getCurrentWindow().close()
            ),
          ];

    return [
      submenu(items.file, [
        onClick(items.newProject, this.onCreateProject),
        onClick(items.openProject, this.onOpenProjectClicked),
        onClick(items.save, this.onSave),
        onClick(items.saveAs, this.onSaveAs),
        onClick(items.saveCopyAs, this.onSaveCopyAs),
        onClick(items.switchWorkspace, this.showPopupSetWorkspace),
        items.separator,
        onClick(items.newPatch, this.props.actions.createPatch),
        items.separator,
        onClick(items.addLibrary, this.props.actions.showLibSuggester),
        onClick(items.publish, this.props.actions.requestPublishProject),
        ...exitItems,
      ]),
      submenu(items.edit, [
        onClick(items.undo, this.props.actions.undoCurrentPatch),
        onClick(items.redo, this.props.actions.redoCurrentPatch),
        items.separator,
        items.cut,
        items.copy,
        items.paste,
        items.selectall,
        items.separator,
        onClick(items.insertNode, () => this.props.actions.showSuggester(null)),
        onClick(items.insertComment, this.props.actions.addComment),
        items.separator,
        onClick(
          items.projectPreferences,
          this.props.actions.showProjectPreferences
        ),
      ]),
      submenu(items.deploy, [
        onClick(items.showCodeForArduino, this.onShowCodeArduino),
        onClick(items.uploadToArduino, this.onUploadToArduinoClicked),
      ]),
      submenu(items.help, [
        {
          key: 'version',
          enabled: false,
          label: `Version: ${packageJson.version}`,
        },
        items.separator,
        onClick(items.openTutorialProject, this.onOpenTutorialProject),
        onClick(items.documentation, () => {
          shell.openExternal(client.getUtmSiteUrl('/docs/', 'docs', 'menu'));
        }),
        onClick(items.shortcuts, () => {
          shell.openExternal(
            client.getUtmSiteUrl('/docs/reference/shortcuts/', 'docs', 'menu')
          );
        }),
        onClick(items.forum, () => {
          shell.openExternal(client.getUtmForumUrl('menu'));
        }),
      ]),
    ];
  }

  static getKeyMap() {
    const commandsBoundToNativeMenu = R.compose(
      R.reject(
        R.anyPass([
          R.isNil,
          R.pipe(R.prop(R.__, client.ELECTRON_ACCELERATOR), R.isNil),
          isAmong([
            // still listen to these
            client.COMMAND.SELECT_ALL,
          ]),
        ])
      ),
      R.map(R.prop('command')),
      R.values
    )(client.menu.items);

    return R.omit(commandsBoundToNativeMenu, client.HOTKEY);
  }

  static getSelectedBoard() {
    return new Promise((resolve, reject) => {
      ipcRenderer.send(EVENTS.GET_SELECTED_BOARD);
      ipcRenderer.once(EVENTS.GET_SELECTED_BOARD, (event, response) => {
        if (response.err) {
          reject(response.data);
        }
        resolve(response.data);
      });
    });
  }

  suggestProjectFilePath() {
    return (
      this.state.projectPath ||
      `${this.state.workspace}/${getProjectName(this.props.project)}`
    );
  }

  initNativeMenu() {
    const viewMenu = {
      label: 'View',
      submenu: [
        client.menu.onClick(
          client.menu.items.toggleHelp,
          this.props.actions.toggleHelp
        ),
        client.menu.onClick(
          client.menu.items.toggleDebugger,
          this.props.actions.toggleDebugger
        ),
        client.menu.onClick(client.menu.items.toggleAccountPane, () =>
          this.props.actions.togglePanel(client.PANEL_IDS.ACCOUNT)
        ),
        { type: 'separator' },
        client.menu.onClick(
          client.menu.items.panToOrigin,
          this.props.actions.setCurrentPatchOffsetToOrigin
        ),
        client.menu.onClick(
          client.menu.items.panToCenter,
          this.props.actions.setCurrentPatchOffsetToCenter
        ),
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
      finalTemplate => {
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
            submenu: [{ role: 'minimize' }, { role: 'close' }],
          })
        )
      ),
      R.append(viewMenu),
      R.init // get rid of help menu, we'll reappend it later
    )(template);
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

  static listBoards() {
    return new Promise((resolve, reject) => {
      ipcRenderer.send(EVENTS.LIST_BOARDS);
      ipcRenderer.once(EVENTS.LIST_BOARDS, (event, response) => {
        if (response.err) {
          reject(response.data);
        }
        resolve(response.data);
      });
    });
  }
  static listPorts() {
    return new Promise((resolve, reject) => {
      ipcRenderer.send(EVENTS.LIST_PORTS);
      ipcRenderer.once(EVENTS.LIST_PORTS, (event, response) => {
        if (response.err) {
          reject(response.data);
        }
        resolve(response.data);
      });
    });
  }

  renderPopupUploadConfig() {
    return this.props.popups.uploadToArduinoConfig ? (
      <PopupUploadConfig
        isVisible
        getSelectedBoard={this.constructor.getSelectedBoard}
        selectedPort={this.props.selectedPort}
        listBoards={this.constructor.listBoards}
        listPorts={this.constructor.listPorts}
        compileLimitLeft={this.props.compileLimitLeft}
        updateCompileLimit={this.props.actions.updateCompileLimit}
        initialDebugAfterUpload={
          this.props.popupsData.uploadToArduinoConfig.debugAfterUpload
        }
        onBoardChanged={this.constructor.onArduinoTargetBoardChange}
        onPortChanged={this.onSerialPortChange}
        onUpload={this.onUploadToArduino}
        onClose={this.onUploadConfigClose}
      />
    ) : null;
  }

  render() {
    return (
      <HotKeys keyMap={this.constructor.getKeyMap()} id="App">
        <EventListener
          target={window}
          onResize={this.onResize}
          onKeyDown={this.constructor.onKeyDown}
        />
        <client.Editor
          size={this.state.size}
          stopDebuggerSession={() =>
            debuggerIPC.sendStopDebuggerSession(ipcRenderer)
          }
          onUploadClick={this.onUploadToArduinoClicked}
          onUploadAndDebugClick={this.onUploadToArduinoAndDebugClicked}
        />
        {this.renderPopupShowCode()}
        {this.renderPopupUploadConfig()}
        {this.renderPopupProjectPreferences()}
        {this.renderPopupPublishProject()}
        {this.renderPopupCreateNewProject()}
        <PopupSetWorkspace
          workspace={this.state.workspace}
          isClosable={R.propOr(
            false,
            'disposable',
            this.props.popupsData.switchWorkspace
          )}
          isVisible={this.props.popups.switchWorkspace}
          onChange={this.onWorkspaceChange}
          onClose={this.hideAllPopups}
        />
        <PopupCreateWorkspace
          data={this.props.popupsData.createWorkspace}
          isVisible={this.props.popups.createWorkspace}
          onCreateWorkspace={this.onWorkspaceCreate}
          onClose={this.showPopupSetWorkspaceNotCancellable}
        />
        {/* TODO: Refactor this mess: */}
        {this.state.downloadProgressPopup ? (
          <client.PopupAlert
            title="Downloading update for XOD IDE"
            closeText="Close"
            onClose={() => {
              this.setState(R.assoc('downloadProgressPopup', false));
              this.setState(R.assoc('downloadProgressPopupError', null));
            }}
            isClosable={this.state.downloadProgressPopupError}
          >
            {this.state.downloadProgressPopupError ? (
              <div>
                <p>
                  Error occured during downloading or installing the update.<br />
                  Please report the bug on our{' '}
                  <a href="https://forum.xod.io/" rel="noopener noreferrer">
                    forum
                  </a>.
                </p>
                <pre>{this.state.downloadProgressPopupError}</pre>
              </div>
            ) : (
              <div>
                <p>Downloading of the update for XOD IDE is in progress.</p>
                <p>
                  After download, we will automatically install it and restart
                  the application.<br />
                  It could take up to a few minutes.
                </p>
                <p>Keep calm and brew a tea.</p>
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
  hasUnsavedChanges: PropTypes.bool,
  projects: PropTypes.object,
  lastSavedProject: client.sanctuaryPropType(Project),
  project: client.sanctuaryPropType(Project),
  actions: PropTypes.objectOf(PropTypes.func),
  upload: PropTypes.object,
  compileLimitLeft: PropTypes.number,
  workspace: PropTypes.string,
  selectedPort: PropTypes.object,
});

const getSaveProcess = R.compose(
  client.findProcessByType(client.SAVE_ALL),
  client.getProccesses
);

const mapStateToProps = R.applySpec({
  hasUnsavedChanges: client.hasUnsavedChanges,
  lastSavedProject: client.getLastSavedProject,
  project: client.getProject,
  user: client.getUser,
  upload: getUploadProcess,
  saveProcess: getSaveProcess,
  currentPatchPath: client.getCurrentPatchPath,
  selectedPort: getSelectedSerialPort,
  compileLimitLeft: client.getCompileLimitLeft,
  popups: {
    // TODO: make keys match with POPUP_IDs
    // (for example, `creatingProject` insteand of `createProject`)
    // this way we could make an util that takes an array of POPUP_IDs and generates a spec
    projectSelection: client.getPopupVisibility(
      client.POPUP_ID.OPENING_PROJECT
    ),
    switchWorkspace: client.getPopupVisibility(
      client.POPUP_ID.SWITCHING_WORKSPACE
    ),
    createWorkspace: client.getPopupVisibility(
      client.POPUP_ID.CREATING_WORKSPACE
    ),
    uploadToArduinoConfig: client.getPopupVisibility(
      client.POPUP_ID.UPLOADING_CONFIG
    ),
    showCode: client.getPopupVisibility(client.POPUP_ID.SHOWING_CODE),
    projectPreferences: client.getPopupVisibility(
      client.POPUP_ID.EDITING_PROJECT_PREFERENCES
    ),
    publishingProject: client.getPopupVisibility(
      client.POPUP_ID.PUBLISHING_PROJECT
    ),
  },
  popupsData: {
    projectSelection: client.getPopupData(client.POPUP_ID.OPENING_PROJECT),
    createWorkspace: client.getPopupData(client.POPUP_ID.CREATING_WORKSPACE),
    uploadToArduinoConfig: client.getPopupData(
      client.POPUP_ID.UPLOADING_CONFIG
    ),
    switchWorkspace: client.getPopupData(client.POPUP_ID.SWITCHING_WORKSPACE),
    showCode: client.getPopupData(client.POPUP_ID.SHOWING_CODE),
    publishingProject: client.getPopupData(client.POPUP_ID.PUBLISHING_PROJECT),
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
      saveAll: actions.saveAll,
      openTutorial: actions.openTutorial,
      uploadToArduino: uploadActions.uploadToArduino,
      uploadToArduinoConfig: uploadActions.uploadToArduinoConfig,
      hideUploadConfigPopup: uploadActions.hideUploadConfigPopup,
      selectSerialPort: uploadActions.selectSerialPort,
    }),
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
