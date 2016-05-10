import React from 'react';
import Inspector from './Inspector';

export default class Toolbar extends React.Component {
  render() {
    let style = {
      position: 'fixed',
      left: 0,
      top: this.props.top,
      bottom: 0,
      width: this.props.width,
      backgroundColor: '#333',
      borderTop: '1px solid #444',
    };

    return (
      <div style={style}>
        <Inspector />
      </div>
    );
  }
}
