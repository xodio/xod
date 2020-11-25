import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import { Either } from 'ramda-fantasy';
import {
  foldMaybe,
  foldEither,
  $Maybe,
  fail,
  explodeMaybe,
  allValues,
  maybeProp,
  enquote,
  eitherToPromise,
  foldMaybeWith,
} from 'xod-func-tools';
import {
  Project,
  isValidIdentifier,
  IDENTIFIER_RULES,
  isValidUserDefinedPatchBasename,
  PATCH_BASENAME_RULES,
  getPatchByPath,
  getProjectName,
} from 'xod-project';
import {
  transformProject,
  transpile,
  getNodeIdsMap,
  getNodePinKeysMap,
  getPinsAffectedByErrorRaisers,
  listGlobals,
  extendTProjectWithGlobals,
  hasTetheringInternetNode,
  getTetheringInetNodeId,
  LIVENESS,
} from 'xod-arduino';

import { isInputTarget, elementHasFocusFunction } from '../../utils/browser';
import {
  lowercaseKebabMask,
  patchBasenameMask,
} from '../../utils/inputFormatting';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import PopupPrompt from '../../utils/components/PopupPrompt';
import PopupShowCode from '../../utils/components/PopupShowCode';
import PopupProjectPreferences from '../../project/components/PopupProjectPreferences';
import PopupPublishProject from '../../project/components/PopupPublishProject';

import * as actions from '../actions';
import { selectAll } from '../../editor/actions';
import {
  NO_PATCH_TO_TRANSPILE,
  SIMULATION_ALREADY_RUNNING,
} from '../../editor/messages';
import { USERNAME_NEEDED_FOR_LITERAL } from '../../user/messages';
import { PROJECT_NAME_NEEDED_FOR_LITERAL } from '../../project/messages';
import { DO_NOT_USE_TETHERING_INTERNET_IN_BROWSER } from '../../debugger/messages';
import { COMMAND } from '../../utils/constants';
import { PANEL_IDS } from '../../editor/constants';

import formatErrorMessage from '../formatErrorMessage';
import initialProjectState from '../../project/state';

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.appRef = null;
    this.isBrowser = false; // by default

    this.transformProjectForTranspiler = this.transformProjectForTranspiler.bind(
      this
    );
    this.getGlobals = this.getGlobals.bind(this);
    this.onSelectAll = this.onSelectAll.bind(this);
    this.onFocusOut = this.onFocusOut.bind(this);

    this.defaultHotkeyHandlers = {
      [COMMAND.UNDO]: this.props.actions.undoCurrentPatch,
      [COMMAND.REDO]: this.props.actions.redoCurrentPatch,
      [COMMAND.HIDE_HELPBOX]: this.props.actions.hideHelpbox,
      [COMMAND.TOGGLE_HELP]: this.props.actions.toggleHelp,
      [COMMAND.INSERT_NODE]: event => {
        if (isInputTarget(event)) return;
        this.props.actions.showSuggester(null);
      },
      [COMMAND.PAN_TO_ORIGIN]: this.props.actions.panToOrigin,
      [COMMAND.PAN_TO_CENTER]: this.props.actions.panToCenter,
    };

    // When the parent component <Catcher> catches an error
    // the <App> container will be constructed again,
    // however the redux state still unrecovered,
    // so <App> should open the initial (empty) project
    // to be shown beneath the "Recovering" spinner
    // until the state will be recovered.
    this.props.actions.openProject(initialProjectState);
  }

  componentDidMount() {
    document.addEventListener('cut', this.props.actions.cutEntities);
    document.addEventListener('copy', this.props.actions.copyEntities);
    document.addEventListener('paste', this.props.actions.pasteEntities);

    /**
     * We have to handle some hotkeys, because:
     * - Browser IDE should prevent default event handling
     * - Electron IDE cannot handle some hotkeys correctly
     *   "...some keybindings cannot be overridden on Windows/Linux because they are hard-coded in Chrome."
     *   See details: https://github.com/electron/electron/issues/7165 and related issues
     */
    document.addEventListener('keydown', this.onSelectAll);

    // TODO: Replace with ref and `React.createRef`
    //       after updating React >16.3
    this.appRef = document.getElementById('App');
    if (elementHasFocusFunction(this.appRef)) this.appRef.focus();

    /**
     * Listen capturing focusout on any element inside body element
     * and if element unfocused to the body element — focus on the `App`
     * component to make sure main hotkeys will work anytime.
     */
    document.body.addEventListener('focusout', this.onFocusOut, true);
  }

  componentWillUnmount() {
    // In case that IDE crashes with some error it will reconstruct
    // the <App> container, so we have to clear the document events
    // to avoid duplicating of handlers
    document.removeEventListener('cut', this.props.actions.cutEntities);
    document.removeEventListener('copy', this.props.actions.copyEntities);
    document.removeEventListener('paste', this.props.actions.pasteEntities);
    document.removeEventListener('keydown', this.selectAll);
    document.body.removeEventListener('focusout', this.onFocusOut, true);
  }

  // This method will be called once on the first run of the IDE
  onFirstRun() {
    this.props.actions.fetchGrant(/* startup */ true);
  }

  onFocusOut() {
    // We need a timeout here to await while focus changed on the some element
    setTimeout(() => {
      // If focused changed to the body element — focus to the App
      if (
        document.activeElement === document.body &&
        this.appRef &&
        elementHasFocusFunction(this.appRef)
      ) {
        this.appRef.focus();
      }
    }, 0);
  }

  onShowCodeArduino(liveness = LIVENESS.NONE) {
    R.compose(
      foldEither(
        R.compose(
          this.props.actions.addError,
          R.when(R.is(Error), formatErrorMessage)
        ),
        this.props.actions.showCode
      ),
      R.map(transpile),
      this.transformProjectForTranspiler
    )(liveness);
  }

  onSelectAll(event) {
    // Prevent selecting all contents with "Ctrl+a" or "Command+a"
    const key = event.keyCode || event.which;
    const mod = event.metaKey || event.ctrlKey;

    // CmdOrCtrl+A
    if (mod && key === 65 && !isInputTarget(event)) {
      event.preventDefault();
      this.props.actions.selectAll();
    }
  }

  onRunSimulation() {
    if (this.props.isSimulationAbortable) {
      this.props.actions.addError(SIMULATION_ALREADY_RUNNING);
      return;
    }
    this.props.actions.runSimulationRequested();

    const eitherTProject = this.transformProjectForTranspiler(
      LIVENESS.SIMULATION
    );

    let sessionGlobals = []; // TODO: Refactor
    eitherToPromise(eitherTProject)
      .then(
        tProject =>
          this.isBrowser && hasTetheringInternetNode(tProject)
            ? Promise.reject(DO_NOT_USE_TETHERING_INTERNET_IN_BROWSER)
            : tProject
      )
      .then(tProject => {
        const globalsInProject = listGlobals(tProject);
        return this.getGlobals(globalsInProject).then(globals => {
          sessionGlobals = globals; // TODO: Refactor
          return R.compose(eitherToPromise, extendTProjectWithGlobals)(
            globals,
            tProject
          );
        });
      })
      .then(
        R.applySpec({
          code: transpile,
          nodeIdsMap: getNodeIdsMap,
          nodePinKeysMap: getNodePinKeysMap,
          tetheringInetNodeId: getTetheringInetNodeId,
          pinsAffectedByErrorRaisers: tProj =>
            R.compose(
              foldMaybe(
                {},
                getPinsAffectedByErrorRaisers(tProj, R.__, this.props.project)
              ),
              R.chain(getPatchByPath(R.__, this.props.project))
            )(this.props.currentPatchPath),
        })
      )
      .then(
        ({
          code,
          nodeIdsMap,
          nodePinKeysMap,
          pinsAffectedByErrorRaisers,
          tetheringInetNodeId,
        }) =>
          this.props.actions.runSimulation(
            explodeMaybe(
              'currentPatchPath already folded in `transformProjectForTranspiler`',
              this.props.currentPatchPath
            ),
            nodeIdsMap,
            nodePinKeysMap,
            code,
            pinsAffectedByErrorRaisers,
            sessionGlobals,
            tetheringInetNodeId
          )
      )
      .catch(
        R.compose(err => {
          this.props.actions.addError(err);
          this.props.actions.abortSimulation();
        }, R.when(R.is(Error), formatErrorMessage))
      );
  }

  // GlobalName :: String
  // Like `XOD_TOKEN`, without leading `=`
  // :: [GlobalName] -> Promise (Map GlobalName String) Error
  getGlobals(globalNames) {
    // getters for all globals, will be filtered then
    const globalGetters = {
      XOD_USERNAME: () =>
        R.compose(
          foldMaybeWith(
            () => Promise.reject(USERNAME_NEEDED_FOR_LITERAL),
            enquote
          ),
          R.chain(maybeProp('username'))
        )(this.props.user),
      XOD_PROJECT: () =>
        R.compose(
          R.ifElse(
            R.length,
            projectName => Promise.resolve(enquote(projectName)),
            () => Promise.reject(PROJECT_NAME_NEEDED_FOR_LITERAL)
          ),
          getProjectName
        )(this.props.project),
      XOD_TOKEN: () => this.props.actions.renewApiToken().then(enquote),
    };

    return R.compose(allValues, R.map(R.call), R.pick(globalNames))(
      globalGetters
    );
  }

  transformProjectForTranspiler(liveness) {
    try {
      return foldMaybe(
        Either.Left(NO_PATCH_TO_TRANSPILE),
        curPatchPath =>
          transformProject(this.props.project, curPatchPath, liveness),
        this.props.currentPatchPath
      );
    } catch (unexpectedError) {
      // eslint-disable-next-line no-console
      console.error(unexpectedError);

      return fail('UNEXPECTED_ERROR', {
        message: unexpectedError.message,
      });
    }
  }

  renderPopupShowCode() {
    return (
      <PopupShowCode
        isVisible={this.props.popups.showCode}
        code={this.props.popupsData.showCode.code}
        onClose={this.props.actions.hideAllPopups}
      />
    );
  }

  renderPopupProjectPreferences() {
    return this.props.popups.projectPreferences ? (
      <PopupProjectPreferences
        isVisible
        project={this.props.project}
        onChange={this.props.actions.updateProjectMeta}
        onClose={this.props.actions.hideProjectPreferences}
        onGenerateApiKey={this.props.actions.generateApiKey}
      />
    ) : null;
  }

  renderPopupPublishProject() {
    return (
      <PopupPublishProject
        isVisible={this.props.popups.publishingProject}
        project={this.props.project}
        user={this.props.user}
        isPublishing={this.props.popupsData.publishingProject.isPublishing}
        onPublish={this.props.actions.publishProject}
        onRequestToEditPreferences={this.props.actions.showProjectPreferences}
        onClose={this.props.actions.cancelPublishingProject}
      />
    );
  }

  renderPopupCreateNewProject() {
    if (!this.props.popups.createProject) return null;

    return (
      <PopupPrompt
        title="Create new project"
        confirmText="Create project"
        isVisible={this.props.popups.createProject}
        onConfirm={this.onCreateProject}
        onClose={this.props.actions.hideAllPopups}
        inputMask={lowercaseKebabMask}
        inputValidator={isValidIdentifier}
        helpText={IDENTIFIER_RULES}
      >
        <p>Please, give a sonorous name to your project:</p>
      </PopupPrompt>
    );
  }

  renderPatchCreatingPopup() {
    if (!this.props.popups.createPatch) return null;

    return (
      <PopupPrompt
        key="new_patch"
        title="Create new patch"
        onConfirm={this.props.actions.addPatch}
        onClose={this.props.actions.hideAllPopups}
        inputMask={patchBasenameMask}
        inputValidator={isValidUserDefinedPatchBasename}
        helpText={PATCH_BASENAME_RULES}
      >
        Type the name for new patch:
      </PopupPrompt>
    );
  }

  render() {
    return <div id="App" />;
  }
}

App.propTypes = {
  project: sanctuaryPropType(Project),
  user: PropTypes.object,
  currentPatchPath: sanctuaryPropType($Maybe($.String)),
  popups: PropTypes.objectOf(PropTypes.bool),
  popupsData: PropTypes.objectOf(PropTypes.object),
  isSimulationAbortable: PropTypes.bool.isRequired,
  actions: PropTypes.shape({
    selectAll: PropTypes.func.isRequired,
    createProject: PropTypes.func.isRequired,
    updateProjectMeta: PropTypes.func.isRequired,
    hideAllPopups: PropTypes.func.isRequired,
    hideProjectPreferences: PropTypes.func.isRequired,
    cutEntities: PropTypes.func.isRequired,
    copyEntities: PropTypes.func.isRequired,
    pasteEntities: PropTypes.func.isRequired,
    /* eslint-disable react/no-unused-prop-types */
    requestPublishProject: PropTypes.func.isRequired,
    cancelPublishingProject: PropTypes.func.isRequired,
    importProject: PropTypes.func.isRequired,
    openProject: PropTypes.func.isRequired,
    createPatch: PropTypes.func.isRequired,
    publishProject: PropTypes.func.isRequired,
    addComment: PropTypes.func.isRequired,
    addPatch: PropTypes.func.isRequired,
    undoCurrentPatch: PropTypes.func.isRequired,
    redoCurrentPatch: PropTypes.func.isRequired,
    setMode: PropTypes.func.isRequired,
    addError: PropTypes.func.isRequired,
    addConfirmation: PropTypes.func.isRequired,
    addNotification: PropTypes.func.isRequired,
    deleteProcess: PropTypes.func.isRequired,
    showCode: PropTypes.func.isRequired,
    showProjectPreferences: PropTypes.func.isRequired,
    toggleHelp: PropTypes.func.isRequired,
    startDebuggerSession: PropTypes.func.isRequired,
    stopDebuggerSession: PropTypes.func.isRequired,
    toggleDebugger: PropTypes.func.isRequired,
    logDebugger: PropTypes.func.isRequired,
    clearDebugger: PropTypes.func.isRequired,
    showSuggester: PropTypes.func.isRequired,
    showLibSuggester: PropTypes.func.isRequired,
    toggleAccountPane: PropTypes.func.isRequired,
    fetchGrant: PropTypes.func.isRequired,
    togglePanel: PropTypes.func.isRequired,
    runSimulation: PropTypes.func.isRequired,
    runSimulationRequested: PropTypes.func.isRequired,
    abortSimulation: PropTypes.func.isRequired,
    generateApiKey: PropTypes.func.isRequired,
    renewApiToken: PropTypes.func.isRequired,
    hideHelpbox: PropTypes.func.isRequired,
    panToOrigin: PropTypes.func.isRequired,
    panToCenter: PropTypes.func.isRequired,
    /* eslint-enable react/no-unused-prop-types */
  }),
};

App.actions = {
  selectAll,
  createProject: actions.createProject,
  requestPublishProject: actions.requestPublishProject,
  cancelPublishingProject: actions.cancelPublishingProject,
  importProject: actions.importProject,
  openProject: actions.openProject,
  publishProject: actions.publishProject,
  createPatch: actions.requestCreatePatch,
  addComment: actions.addComment,
  addPatch: actions.addPatch,
  undoCurrentPatch: actions.undoCurrentPatch,
  redoCurrentPatch: actions.redoCurrentPatch,
  setMode: actions.setMode,
  addError: actions.addError,
  addConfirmation: actions.addConfirmation,
  addNotification: actions.addNotification,
  deleteProcess: actions.deleteProcess,
  showCode: actions.showCode,
  showProjectPreferences: actions.showProjectPreferences,
  hideProjectPreferences: actions.hideProjectPreferences,
  updateProjectMeta: actions.updateProjectMeta,
  hideAllPopups: actions.hideAllPopups,
  toggleHelp: actions.toggleHelp,
  startDebuggerSession: actions.startDebuggerSession,
  startSerialSession: actions.startSerialSession,
  stopDebuggerSession: actions.stopDebuggerSession,
  toggleDebugger: () => actions.togglePanel(PANEL_IDS.DEPLOYMENT),
  logDebugger: actions.addMessagesToDebuggerLog,
  clearDebugger: actions.clearDebuggerLog,
  cutEntities: actions.cutEntities,
  copyEntities: actions.copyEntities,
  pasteEntities: actions.pasteEntities,
  setCurrentPatchOffsetToOrigin: actions.setCurrentPatchOffsetToOrigin,
  setCurrentPatchOffsetToCenter: actions.setCurrentPatchOffsetToCenter,
  showSuggester: actions.showSuggester,
  showLibSuggester: actions.showLibSuggester,
  toggleAccountPane: actions.toggleAccountPane,
  fetchGrant: actions.fetchGrant,
  togglePanel: actions.togglePanel,
  splitLinksToBuses: actions.splitLinksToBuses,
  runSimulation: actions.runSimulation,
  runSimulationRequested: actions.runSimulationRequested,
  abortSimulation: actions.abortSimulation,
  generateApiKey: actions.generateApiKey,
  renewApiToken: actions.renewApiToken,
  hideHelpbox: actions.hideHelpbox,
  panToOrigin: actions.setCurrentPatchOffsetToOrigin,
  panToCenter: actions.setCurrentPatchOffsetToCenter,
};
