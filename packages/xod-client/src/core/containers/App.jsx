import React from 'react';
import { toV2 } from 'xod-project';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';

export default class App extends React.Component {
  onShowCodeEspruino() {
    const projectV2 = toV2(this.props.project);
    this.setState({
      code: transpileForEspruino(projectV2, this.props.currentPatchId),
    });
    this.showCodePopup();
  }

  onShowCodeNodejs() {
    const projectV2 = toV2(this.props.project);
    this.setState({
      code: transpileForNodeJS(projectV2, this.props.currentPatchId),
    });
    this.showCodePopup();
  }
  render() {
    return <div />;
  }
}

App.propTypes = {
  project: React.PropTypes.object,
  currentPatchId: React.PropTypes.string,
};
