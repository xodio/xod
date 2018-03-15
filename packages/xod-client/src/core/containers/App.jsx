import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import { Either } from 'ramda-fantasy';
import { foldMaybe, foldEither, $Maybe } from 'xod-func-tools';
import { Project, isValidIdentifier, IDENTIFIER_RULES } from 'xod-project';
import {
  transformProject,
  transformProjectWithDebug,
  transpile,
} from 'xod-arduino';

import { lowercaseKebabMask } from '../../utils/inputFormatting';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import PopupPrompt from '../../utils/components/PopupPrompt';
import PopupShowCode from '../../utils/components/PopupShowCode';
import PopupProjectPreferences from '../../project/components/PopupProjectPreferences';
import PopupPublishProject from '../../project/components/PopupPublishProject';

import * as actions from '../actions';
import { NO_PATCH_TO_TRANSPILE } from '../../editor/messages';
import composeMessage from '../../messages/composeMessage';

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.transformProjectForTranspiler = this.transformProjectForTranspiler.bind(
      this
    );
  }
  componentDidMount() {
    document.addEventListener('cut', this.props.actions.cutEntities);
    document.addEventListener('copy', this.props.actions.copyEntities);
    document.addEventListener('paste', this.props.actions.pasteEntities);
    this.props.actions.updateCompileLimit(/* startup */ true);
  }

  onShowCodeArduino() {
    return R.compose(
      foldEither(
        R.compose(
          this.props.actions.addError,
          R.when(R.is(Error), err => {
            const title = err.title || err.message;
            const message = err.title ? err.message : null;
            return composeMessage(title, message);
          })
        ),
        this.props.actions.showCode
      ),
      R.map(transpile),
      this.transformProjectForTranspiler
    )();
  }

  transformProjectForTranspiler(debug = false) {
    const transformFn = debug ? transformProjectWithDebug : transformProject;
    return foldMaybe(
      Either.Left(NO_PATCH_TO_TRANSPILE),
      curPatchPath => transformFn(this.props.project, curPatchPath),
      this.props.currentPatchPath
    );
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
    return (
      <PopupProjectPreferences
        isVisible={this.props.popups.projectPreferences}
        project={this.props.project}
        onChange={this.props.actions.updateProjectMeta}
        onClose={this.props.actions.hideProjectPreferences}
      />
    );
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

  render() {
    return <div />;
  }
}

App.propTypes = {
  project: sanctuaryPropType(Project),
  user: PropTypes.object,
  currentPatchPath: sanctuaryPropType($Maybe($.String)),
  popups: PropTypes.objectOf(PropTypes.bool),
  popupsData: PropTypes.objectOf(PropTypes.object),
  actions: PropTypes.shape({
    updateCompileLimit: PropTypes.func.isRequired,
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
    showLibSuggester: PropTypes.func.isRequired,
    toggleAccountPane: PropTypes.func.isRequired,
    fetchGrant: PropTypes.func.isRequired,
    togglePanel: PropTypes.func.isRequired,
    /* eslint-enable react/no-unused-prop-types */
  }),
};

App.actions = {
  updateCompileLimit: actions.updateCompileLimit,
  createProject: actions.createProject,
  requestPublishProject: actions.requestPublishProject,
  cancelPublishingProject: actions.cancelPublishingProject,
  importProject: actions.importProject,
  openProject: actions.openProject,
  publishProject: actions.publishProject,
  createPatch: actions.requestCreatePatch,
  addComment: actions.addComment,
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
  stopDebuggerSession: actions.stopDebuggerSession,
  toggleDebugger: actions.toggleDebugger,
  showSuggester: actions.showSuggester,
  logDebugger: actions.addMessagesToDebuggerLog,
  clearDebugger: actions.clearDebuggerLog,
  cutEntities: actions.cutEntities,
  copyEntities: actions.copyEntities,
  pasteEntities: actions.pasteEntities,
  setCurrentPatchOffsetToOrigin: actions.setCurrentPatchOffsetToOrigin,
  setCurrentPatchOffsetToCenter: actions.setCurrentPatchOffsetToCenter,
  showLibSuggester: actions.showLibSuggester,
  toggleAccountPane: actions.toggleAccountPane,
  fetchGrant: actions.fetchGrant,
  togglePanel: actions.togglePanel,
};
