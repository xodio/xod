import React from 'react';
import { Project } from 'xod-project';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';
import { transpileForArduino } from 'xod-arduino';
import { foldEither } from 'xod-func-tools';

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

  render() {
    return <div />;
  }
}

App.propTypes = {
  projectV2: sanctuaryPropType(Project),
  currentPatchId: React.PropTypes.string,
};
