import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { Either } from 'ramda-fantasy';
import { Project, getProjectName, isValidProject, isValidIdentifier, IDENTIFIER_RULES } from 'xod-project';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';
import { transpileForArduino } from 'xod-arduino';
import { foldEither } from 'xod-func-tools';

import { lowercaseKebabMask } from '../../utils/inputFormatting';
import { getJSONForExport } from '../../project/utils';
import { SAVE_LOAD_ERRORS } from '../../messages/constants';
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

  onImport(json) {
    const eitherProject = R.tryCatch(
      R.pipe(JSON.parse, Either.of),
      R.always(Either.Left(SAVE_LOAD_ERRORS.NOT_A_JSON))
    )(json).chain(
      R.ifElse(
        isValidProject,
        Either.of,
        R.always(Either.Left(SAVE_LOAD_ERRORS.INVALID_FORMAT))
      )
    );

    Either.either(
      this.props.actions.addError,
      this.props.actions.importProject,
      eitherProject
    );
  }

  onExport() {
    const { project } = this.props;

    const projectJSON = getJSONForExport(project);
    const projectName = getProjectName(project);
    const link = (document) ? document.createElement('a') : null;
    const url = `data:application/xod;charset=utf8,${encodeURIComponent(projectJSON)}`;

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
        onClose={this.hideAllPopups}
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
    addError: PropTypes.func.isRequired,
    importProject: PropTypes.func.isRequired,
    showCode: PropTypes.func.isRequired,
    hideAllPopups: PropTypes.func.isRequired,
    updateProjectMeta: PropTypes.func.isRequired,
    // eslint-disable-next-line react/no-unused-prop-types
    showProjectPreferences: PropTypes.func.isRequired,
    hideProjectPreferences: PropTypes.func.isRequired,
  }),
};

App.actions = {
  createProject: actions.createProject,
  requestRenameProject: actions.requestRenameProject,
  importProject: actions.importProject,
  openProject: actions.openProject,
  createPatch: actions.requestCreatePatch,
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
