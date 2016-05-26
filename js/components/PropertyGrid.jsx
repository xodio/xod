import React from 'react';

export default class PropertyGrid extends React.Component {
  render() {
    let style = {
    };

    return (
      <table style={style}>
        <tbody>
          {this.props.children}
        </tbody>
      </table>
    );
  }
}
