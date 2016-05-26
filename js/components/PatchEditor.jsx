import React from 'react';

import Canvas from './Canvas';

export default class PatchEditor extends React.Component {
  render() {
    let style = {
      position: 'absolute',
      left: this.props.left,
      top: this.props.top,
      right: 0,
      bottom: 0,
      overflow: 'auto',
    };

    let canvas = null;
    if (this.props.patch) {
      canvas = <Canvas patch={this.props.patch}
        onSelectionChanged={this.props.onSelectionChanged} />;
    }

    return (<div style={style}>{canvas}</div>);
  }
}
