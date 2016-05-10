import React from 'react';

import Button from './Button';
import ToolbarItem from './ToolbarItem';

export default class Toolbar extends React.Component {
  render() {
    let style = {
      position: 'fixed',
      left: 0,
      top: 0,
      right: 0,
      height: this.props.height,
      lineHeight: `${this.props.height}px`,
      backgroundColor: '#333',
      borderBottom: '1px solid #222',
      boxSizing: 'border-box',
      color: 'white',
    };

    return (
      <div style={style}>
        <ToolbarItem>XOD</ToolbarItem>
        <ToolbarItem>
          <Button id="upload">Upload</Button>
        </ToolbarItem>
      </div>
    );
  }
}
