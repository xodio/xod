import React from 'react';

class Inspector extends React.Component {
  constructor(props) {
    super(props);
    this.displayName = 'Inspector';
  }

  render() {
    return (
      <div>
        <p><small>Inspector</small></p>
        <ul>
          {this.widgets.map(widget =>
            <li>
              {widget.name}
            </li>
          )}
        </ul>
      </div>
    );
  }
}

Inspector.propTypes = {
  selection: React.PropTypes.array,
  nodeTypes: React.PropTypes.object,
  onPropUpdate: React.PropTypes.func,
};

Inspector.defaultProps = {
  selection: [],
  nodeTypes: {},
  onPropUpdate: f => f,
};

export default Inspector;
