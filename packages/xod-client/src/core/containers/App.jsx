import React from 'react';
import { toV2 } from 'xod-project';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';
import { transpileForArduino } from 'xod-arduino';
import { foldEither } from 'xod-func-tools';

const transpile = (context, transpiler) => {
  const projectV2 = toV2(context.props.project);
  return transpiler(projectV2, context.props.currentPatchId);
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
  project: React.PropTypes.object,
  currentPatchId: React.PropTypes.string,
};
