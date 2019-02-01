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
import { Project, getProjectName } from 'xod-project';
import {
  foldEither,
  isAmong,
  explodeMaybe,
  noop,
  tapP,
  eitherToPromise,
  createError,
} from 'xod-func-tools';
import {
  transpile,
  getNodeIdsMap,
  getRequireUrls,
  LIVENESS,
} from 'xod-arduino';
import { messages as xdbMessages } from 'xod-deploy-bin';

import packageJson from '../../../package.json';

import * as actions from '../actions';
import * as uploadActions from '../../upload/actions';
import { listBoards, upload } from '../../upload/arduinoCli';
import * as debuggerIPC from '../../debugger/ipcActions';
import {
  getUploadProcess,
  isDeploymentInProgress,
  getSelectedSerialPort,
} from '../../upload/selectors';
import * as settingsActions from '../../settings/actions';
import PopupSetWorkspace from '../../settings/components/PopupSetWorkspace';
import PopupCreateWorkspace from '../../settings/components/PopupCreateWorkspace';
import PopupUploadConfig from '../../upload/components/PopupUploadConfig';
import { SaveProgressBar } from '../components/SaveProgressBar';

import formatError from '../../shared/errorFormatter';
import * as EVENTS from '../../shared/events';
import { INSTALL_ARDUINO_DEPENDENCIES_MSG } from '../../arduinoDependencies/constants';
import {
  checkDeps,
  updateArdupackages,
  closePackageUpdatePopup,
  proceedPackageUpgrade,
} from '../../arduinoDependencies/actions';
import { loadWorkspacePath } from '../../app/workspaceActions';
import { getPathToBundledWorkspace } from '../../app/utils';

import getLibraryNames from '../../arduinoDependencies/getLibraryNames';

import { subscribeAutoUpdaterEvents } from '../autoupdate';
import subscribeToTriggerMainMenuRequests from '../../testUtils/triggerMainMenu';
import { TRIGGER_SAVE_AS, TRIGGER_LOAD_PROJECT } from '../../testUtils/events';

import {
  getOpenDialogFileFilters,
  createSaveDialogOptions,
} from '../nativeDialogs';
import { STATES, getEventNameWithState } from '../../shared/eventStates';

import UpdateArduinoPackagesPopup from '../../arduinoDependencies/components/UpdateArduinoPackagesPopup';
import { checkArduinoDependencies } from '../../arduinoDependencies/runners';

import { formatErrorMessage, formatLogError } from '../formatError';

const { app, dialog, Menu } = remoteElectron;
const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

const defaultState = {
  size: client.getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
  workspace: '',
  projectPath: null,
  downloadProgressPopup: false,
  downloadProgressPopupError: null,
};

const stopDebuggerSession = () =>
  debuggerIPC.sendStopDebuggerSession(ipcRenderer);

class App extends client.App {
  constructor(props) {
    super(props);

    this.state = R.clone(defaultState);

    this.onResize = this.onResize.bind(this);

    this.suggestProjectFilePath = this.suggestProjectFilePath.bind(this);
    this.selectAll = this.selectAll.bind(this);

    this.onUploadToArduinoClicked = this.onUploadToArduinoClicked.bind(this);
    this.onUploadToArduinoAndDebugClicked = this.onUploadToArduinoAndDebugClicked.bind(
      this
    );
    this.onUploadToArduino = this.onUploadToArduino.bind(this);
    this.onSerialPortChange = this.onSerialPortChange.bind(this);
    this.onShowCodeArduino = this.onShowCodeArduino.bind(this);
    this.onRunSimulation = this.onRunSimulation.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onSaveAs = this.onSaveAs.bind(this);
    this.onSaveCopyAs = this.onSaveCopyAs.bind(this);
    this.onOpenProjectClicked = this.onOpenProjectClicked.bind(this);
    this.onOpenTutorialProject = this.onOpenTutorialProject.bind(this);

    this.onUploadConfigClose = this.onUploadConfigClose.bind(this);
    this.onWorkspaceChange = this.onWorkspaceChange.bind(this);
    this.onWorkspaceCreate = this.onWorkspaceCreate.bind(this);
    this.onCreateProject = this.onCreateProject.bind(this);

    this.onLoadProject = this.onLoadProject.bind(this);
    this.onArduinoPathChange = this.onArduinoPathChange.bind(this);

    this.onStopDebuggerSessionClicked = this.onStopDebuggerSessionClicked.bind(
      this
    );

    this.showError = this.showError.bind(this);

    this.hideAllPopups = this.hideAllPopups.bind(this);
    this.showPopupSetWorkspace = this.showPopupSetWorkspace.bind(this);
    this.showPopupSetWorkspaceNotCancellable = this.showPopupSetWorkspaceNotCancellable.bind(
      this
    );
    this.showCreateWorkspacePopup = this.showCreateWorkspacePopup.bind(this);

    this.requestInstallArduinoDependencies = this.requestInstallArduinoDependencies.bind(
      this
    );

    this.onUpdatePackagesClicked = this.onUpdatePackagesClicked.bind(this);

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
      this.showError(error);
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

    // Notify about errors in the Main Process
    ipcRenderer.on(EVENTS.ERROR_IN_MAIN_PROCESS, (event, error) => {
      console.error(error); // eslint-disable-line no-console
      this.showError(error);
    });

    this.hotkeyHandlers = {
      [client.COMMAND.UNDO]: this.props.actions.undoCurrentPatch,
      [client.COMMAND.REDO]: this.props.actions.redoCurrentPatch,
    };

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

        this.saveAs(projectPath, true, false).catch(noop);
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

  shouldComponentUpdate(nextProps, nextState) {
    const props = this.props;
    // Custom checks for some props
    // All other props will be checked for ===
    const propChecks = {
      currentPatchPath: (prev, next) => prev.equals(next), // Maybe.equals
      popups: R.equals,
      popupsData: R.equals,
    };
    const propEquality = R.mapObjIndexed((val, key) =>
      R.ifElse(
        R.has(key),
        R.pipe(R.prop(key), check => check(val, nextProps[key])),
        () => val === nextProps[key]
      )(propChecks)
    )(props);

    return (
      R.any(R.equals(false), R.values(propEquality)) ||
      !R.equals(this.state, nextState)
    );
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

    const eitherTProject = this.transformProjectForTranspiler(
      debug ? LIVENESS.DEBUG : LIVENESS.NONE
    );

    stopDebuggerSession();

    eitherToPromise(eitherTProject)
      .then(
        tapP(tProj => {
          const libraries = getRequireUrls(tProj);
          const checkProcess = this.props.actions.checkDeps();
          const deps = R.compose(
            R.assoc('libraries', libraries),
            R.ifElse(
              R.has('package'),
              R.compose(
                R.objOf('packages'),
                R.of,
                R.pick(['package', 'packageName'])
              ),
              R.always({ packages: [] })
            )
          )(board);
          return checkArduinoDependencies(
            progressData =>
              checkProcess.progress(
                progressData.note,
                progressData.percentage * 10
              ),
            deps
          )
            .then(this.requestInstallArduinoDependencies)
            .then(() => checkProcess.success())
            .catch(err => {
              checkProcess.delete();
              return Promise.reject(err);
            });
        })
      )
      .then(transform =>
        Promise.all([transpile(transform), loadWorkspacePath()])
      )
      .then(([code, ws]) =>
        upload(
          progressData => {
            proc.progress(
              progressData.message,
              progressData.percentage,
              progressData.tab
            );
          },
          {
            code,
            cloud,
            board,
            port,
            ws,
            wsBundledPath: getPathToBundledWorkspace(),
          }
        )
      )
      .then(() => {
        proc.success();
        this.props.actions.addConfirmation(
          // eslint-disable-next-line new-cap
          xdbMessages.UPLOADED_SUCCESSFULLY()
        );
      })
      .then(() => {
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
                client.createSystemMessage('Debug session started'),
                nodeIdsMap,
                currentPatchPath
              );
              debuggerIPC.sendStartDebuggerSession(ipcRenderer, port);
            },
            R.map(getNodeIdsMap, eitherTProject)
          );
        }
      })
      .catch(err => {
        if (err.type === 'ARDUINO_DEPENDENCIES_MISSING') {
          proc.progress(formatLogError(err), 0, client.LOG_TAB_TYPE.INSTALLER);
          proc.delete();
          return;
        }
        proc.fail(formatLogError(err), 0);
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
      this.saveAs(this.state.projectPath, false, true)
        .then(onAfterSave)
        .catch(noop);
    } else {
      this.onSaveAs(onAfterSave);
    }
  }

  saveAs(filePath, shouldUpdateProjectPath, shouldUpdateLastSavedProject) {
    return new Promise((resolve, reject) => {
      this.props.actions.saveAll({
        oldProject: this.props.lastSavedProject,
        newProject: this.props.project,
        projectPath: filePath,
        updateProjectPath: shouldUpdateProjectPath,
        updateLastSavedProject: shouldUpdateLastSavedProject,
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
        this.saveAs(filePath, true, true)
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
        this.saveAs(filePath, false, false).catch(noop);
      }
    );
  }

  showError(error) {
    this.props.actions.addError(formatErrorMessage(error));
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

  onUpdatePackagesClicked() {
    this.props.actions.updateArdupackages();
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

  onStopDebuggerSessionClicked() {
    if (this.props.isSimulationRunning) {
      this.props.actions.abortSimulation();
    } else {
      stopDebuggerSession();
    }
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
        onClick(items.selectall, this.selectAll),
        items.separator,
        onClick(items.insertNode, () => this.props.actions.showSuggester(null)),
        onClick(items.insertComment, this.props.actions.addComment),
        items.separator,
        onClick(items.splitLinksToBuses, this.props.actions.splitLinksToBuses),
        items.separator,
        onClick(
          items.projectPreferences,
          this.props.actions.showProjectPreferences
        ),
      ]),
      submenu(items.deploy, [
        onClick(items.showCodeForArduino, this.onShowCodeArduino),
        onClick(items.uploadToArduino, this.onUploadToArduinoClicked),
        onClick(items.runSimulation, this.onRunSimulation),
        items.separator,
        onClick(items.updatePackages, this.onUpdatePackagesClicked),
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

    return R.omit(
      commandsBoundToNativeMenu,
      client.menu.getOsSpecificHotkeys()
    );
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
        client.menu.onClick(client.menu.items.toggleProjectBrowser, () =>
          this.props.actions.togglePanel(client.PANEL_IDS.PROJECT_BROWSER)
        ),
        client.menu.onClick(client.menu.items.toggleInspector, () =>
          this.props.actions.togglePanel(client.PANEL_IDS.INSPECTOR)
        ),
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
    this.props.actions.requestSwitchWorkspace({ disposable: true });
  }

  showPopupSetWorkspaceNotCancellable() {
    this.props.actions.requestSwitchWorkspace({ disposable: false });
  }

  showCreateWorkspacePopup(path, force) {
    this.props.actions.requestCreateWorkspace(path, force);
  }

  hideAllPopups() {
    this.props.actions.hideAllPopups();
  }

  selectAll() {
    // Handler for menu item "Select All"
    // We can't use `role: 'selectall'` here, because it ignores `onClick`.
    // So we have to handle all cases manually:

    // - select all in inputs
    if (client.isInput(document.activeElement)) {
      document.activeElement.select();
      return;
    }

    // - select entities on Patch
    this.props.actions.selectAll();
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

  requestInstallArduinoDependencies({ libraries, packages }) {
    const getError = (missingLibs, missingPackages) =>
      createError('ARDUINO_DEPENDENCIES_MISSING', {
        libraries: missingLibs,
        packages: missingPackages,
        libraryNames: getLibraryNames(missingLibs),
        packageNames: R.pluck('packageName', missingPackages),
      });

    const libsToInstall = R.pipe(R.filter(R.not), R.keys)(libraries);
    const packagesToInstall = R.reject(R.prop('installed'))(packages);

    const installationNeeded =
      libsToInstall.length + packagesToInstall.length > 0;

    if (installationNeeded) {
      const err = getError(libsToInstall, packagesToInstall);
      this.props.actions.addNotification(
        formatErrorMessage(err),
        INSTALL_ARDUINO_DEPENDENCIES_MSG
      );

      return Promise.reject(err);
    }

    return Promise.resolve({ libraries, packages });
  }

  renderPopupUploadConfig() {
    return this.props.popups.uploadToArduinoConfig ? (
      <PopupUploadConfig
        isVisible
        isDeploymentInProgress={this.props.isDeploymentInProgress}
        getSelectedBoard={this.constructor.getSelectedBoard}
        selectedPort={this.props.selectedPort}
        listBoards={listBoards}
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
        onError={this.showError}
      />
    ) : null;
  }

  renderPopupCheckArduinoPackageUpdates() {
    return this.props.popups.updateArduinoPackages ? (
      <UpdateArduinoPackagesPopup
        isVisible={this.props.popups.updateArduinoPackages}
        onClose={this.props.actions.closePackageUpdatePopup}
        onUpdateConfirm={this.props.actions.proceedPackageUpgrade}
      />
    ) : null;
  }

  render() {
    return (
      <HotKeys
        keyMap={this.constructor.getKeyMap()}
        handlers={this.hotkeyHandlers}
        id="App"
      >
        <EventListener
          target={window}
          onResize={this.onResize}
          onKeyDown={this.constructor.onKeyDown}
        />
        <client.Editor
          size={this.state.size}
          stopDebuggerSession={this.onStopDebuggerSessionClicked}
          onUploadClick={this.onUploadToArduinoClicked}
          onUploadAndDebugClick={this.onUploadToArduinoAndDebugClicked}
          onRunSimulationClick={this.onRunSimulation}
        />
        {this.renderPopupShowCode()}
        {this.renderPopupUploadConfig()}
        {this.renderPopupProjectPreferences()}
        {this.renderPopupPublishProject()}
        {this.renderPopupCreateNewProject()}
        {this.renderPopupCheckArduinoPackageUpdates()}
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
  isSimulationRunning: PropTypes.bool.isRequired,
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
  isSimulationRunning: client.isSimulationRunning,
  isDeploymentInProgress,
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
    updateArduinoPackages: client.getPopupVisibility(
      client.POPUP_ID.UPDATE_ARDUINO_PACKAGES_POPUP
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
      updateArdupackages,
      closePackageUpdatePopup,
      proceedPackageUpgrade,
      checkDeps,
    }),
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
