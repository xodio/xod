
import React from 'react';

export default class Button extends React.Component {
  render() {
    let style = {
      backgroundColor: '#777',
      color: 'white',
      padding: 10,
      borderRadius: 4,
      boxShadow: '0px 0px 1px 1px rgba(0, 0, 0, 0.5)',
      cursor: 'pointer'
    };

    return (
      <button style={style} {...this.props}>{this.props.children}</button>
    );
  }
}
