import React from 'react';

export default class PropertyGridRow extends React.Component {
  handleEditChange(e) {
    this.props.onChange({value: e.target.value});
  }

  handleCheckboxChange(e) {
    this.props.onChange({value: e.target.checked});
  }

  render() {
    let tdStyle = {
      padding: 4,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    };

    let editStyle = {
      backgroundColor: 'transparent',
      borderBottom: '1px solid #999',
      width: 50,
      color: 'white'
    };

    let widget = null; 
    switch (this.props.type) {
      case 'bool':
        widget = <input type="checkbox"
          onChange={this.handleCheckboxChange.bind(this)}
          defaultChecked={this.props.value} />;
        break;

      default:
        widget = <input style={editStyle}
          onChange={this.handleEditChange.bind(this)}
          type="text" defaultValue={this.props.value} />;
    }

    return (
      <tr>
        <td style={tdStyle}>{this.props.name}</td>
        <td style={tdStyle}>{widget}</td>
      </tr>
    );
  }
}
