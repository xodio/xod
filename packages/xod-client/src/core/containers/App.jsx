import R from 'ramda';
import React from 'react';
import { Either } from 'ramda-fantasy';
import { Project, getProjectName, isValidProject } from 'xod-project';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';
import { transpileForArduino } from 'xod-arduino';
import { foldEither } from 'xod-func-tools';

import { SAVE_LOAD_ERRORS } from '../../messages/constants';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

const transpile = (context, transpiler) => {
  const { projectV2, currentPatchId } = context.props;
  return transpiler(projectV2, currentPatchId);
};

const showCode = (context, code) => {
  context.setState({ code });
  context.showCodePopup();
};

const showError = (context, error) => {
  context.props.actions.addError(error);
};

export default class App extends React.Component {
  onShowCodeEspruino() {
    showCode(this, transpile(this, transpileForEspruino));
  }
  onShowCodeNodejs() {
    showCode(this, transpile(this, transpileForNodeJS));
  }
  onShowCodeArduino() {
    const eitherCode = transpile(this, transpileForArduino);
    foldEither(
      error => showError(this, error),
      code => showCode(this, code),
      eitherCode
    );
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
      this.props.actions.loadProjectData,
      eitherProject
    );
  }

  onExport() {
    const { projectV2 } = this.props;
    const projectJSON = JSON.stringify(projectV2, null, 2);

    const projectName = getProjectName(projectV2);
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

  render() {
    return <div />;
  }
}

App.propTypes = {
  projectV2: sanctuaryPropType(Project),
  currentPatchId: React.PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  actions: React.PropTypes.shape({
    addError: React.PropTypes.func.isRequired,
    loadProjectData: React.PropTypes.func.isRequired,
  }),
};
