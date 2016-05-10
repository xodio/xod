import React from 'react';

export default class ToolbarItem extends React.Component {
  render() {
    let style = {
      lineHeight: '1rem',
      margin: '0 12px',
      display: 'inline-block',
    };

    return <div style={style}>{this.props.children}</div>;
  }
}
