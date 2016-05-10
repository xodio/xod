import React from 'react';

export default class Canvas extends React.Component {
  render() {
    let style = {
      position: 'absolute',
      left: this.props.left,
      top: this.props.top,
      right: 0,
      bottom: 0,
      overflow: 'auto',
    };

    return (
      <div style={style}>
        <svg id="canvas" width={1920} height={1080}>
        </svg>
      </div>
    );
  }
}
