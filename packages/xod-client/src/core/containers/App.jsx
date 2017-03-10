import React from 'react';
import { toV2 } from 'xod-project';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';
import { transpileForArduino } from 'xod-arduino';

const showTranspiledCode = (context, transpiler) => {
  const projectV2 = toV2(context.props.project);
  context.setState({
    code: transpiler(projectV2, context.props.currentPatchId),
  });
  context.showCodePopup();
};

export default class App extends React.Component {
  onShowCodeEspruino() {
    showTranspiledCode(this, transpileForEspruino);
  }
  onShowCodeNodejs() {
    showTranspiledCode(this, transpileForNodeJS);
  }
  onShowCodeArduino() {
    showTranspiledCode(this, transpileForArduino);
  }

  render() {
    return <div />;
  }
}

App.propTypes = {
  project: React.PropTypes.object,
  currentPatchId: React.PropTypes.string,
};
