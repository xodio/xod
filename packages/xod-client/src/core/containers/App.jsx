import React from 'react';
import PropTypes from 'prop-types';
import { foldEither } from 'xod-func-tools';
import {
  Project,
  getProjectName,
  fromXodball,
  toXodball,
  isValidIdentifier,
  IDENTIFIER_RULES,
} from 'xod-project';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';
import { transpileForArduino } from 'xod-arduino';

import { lowercaseKebabMask } from '../../utils/inputFormatting';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import PopupPrompt from '../../utils/components/PopupPrompt';
import PopupShowCode from '../../utils/components/PopupShowCode';
import PopupProjectPreferences from '../../project/components/PopupProjectPreferences';

import * as actions from '../actions';

export default class App extends React.Component {
  onShowCodeEspruino() {
    this.transpile(transpileForEspruino);
  }
  onShowCodeNodejs() {
    this.transpile(transpileForNodeJS);
  }
  onShowCodeArduino() {
    this.transpile(transpileForArduino);
  }

  onImport(jsonString) {
    foldEither(
      this.props.actions.addError,
      this.props.actions.importProject,
      fromXodball(jsonString)
    );
  }

  onExport() {
    const { project } = this.props;

    const xodballJSON = toXodball(project);
    const xodballName = getProjectName(project);
    const link = (document) ? document.createElement('a') : null;
    const url = `data:application/xod;charset=utf8,${encodeURIComponent(xodballJSON)}`;

    if (link && link.download !== undefined) {
      link.href = url;
      link.setAttribute('download', `${xodballName}.xodball`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(url, '_blank');
      window.focus();
    }
  }

  transpile(transpiler) {
    const { project, currentPatchPath } = this.props;
    const eitherCode = transpiler(project, currentPatchPath);
    foldEither(
      (error) => {
        console.error(error); // eslint-disable-line no-console
        this.props.actions.addError(error.message);
      },
      (code) => {
        this.props.actions.showCode(code);
      },
      eitherCode
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

  renderPopupCreateNewProject() {
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
        <p>
          Please, give a sonorous name to your project:
        </p>
      </PopupPrompt>
    );
  }

  render() {
    return <div />;
  }
}

App.propTypes = {
  project: sanctuaryPropType(Project),
  currentPatchPath: PropTypes.string,
  popups: PropTypes.objectOf(PropTypes.bool),
  popupsData: PropTypes.objectOf(PropTypes.object),
  actions: PropTypes.shape({
    createProject: PropTypes.func.isRequired,
    updateProjectMeta: PropTypes.func.isRequired,
    hideAllPopups: PropTypes.func.isRequired,
    hideProjectPreferences: PropTypes.func.isRequired,
    /* eslint-disable react/no-unused-prop-types */
    requestCreateProject: PropTypes.func.isRequired,
    requestRenameProject: PropTypes.func.isRequired,
    importProject: PropTypes.func.isRequired,
    openProject: PropTypes.func.isRequired,
    createPatch: PropTypes.func.isRequired,
    addComment: PropTypes.func.isRequired,
    undoCurrentPatch: PropTypes.func.isRequired,
    redoCurrentPatch: PropTypes.func.isRequired,
    setMode: PropTypes.func.isRequired,
    setSelectedNodeType: PropTypes.func.isRequired,
    addError: PropTypes.func.isRequired,
    addConfirmation: PropTypes.func.isRequired,
    addNotification: PropTypes.func.isRequired,
    deleteProcess: PropTypes.func.isRequired,
    showCode: PropTypes.func.isRequired,
    showProjectPreferences: PropTypes.func.isRequired,
    /* eslint-enable react/no-unused-prop-types */
  }),
};

App.actions = {
  createProject: actions.createProject,
  requestCreateProject: actions.requestCreateProject,
  requestRenameProject: actions.requestRenameProject,
  importProject: actions.importProject,
  openProject: actions.openProject,
  createPatch: actions.requestCreatePatch,
  addComment: actions.addComment,
  undoCurrentPatch: actions.undoCurrentPatch,
  redoCurrentPatch: actions.redoCurrentPatch,
  setMode: actions.setMode,
  setSelectedNodeType: actions.setSelectedNodeType,
  addError: actions.addError,
  addConfirmation: actions.addConfirmation,
  addNotification: actions.addNotification,
  deleteProcess: actions.deleteProcess,
  showCode: actions.showCode,
  showProjectPreferences: actions.showProjectPreferences,
  hideProjectPreferences: actions.hideProjectPreferences,
  updateProjectMeta: actions.updateProjectMeta,
  hideAllPopups: actions.hideAllPopups,
};
