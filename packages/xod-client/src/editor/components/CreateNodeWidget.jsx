import React from 'react';
import R from 'ramda';
import { Icon } from 'react-fa';

class CreateNodeWidget extends React.Component {
  constructor(props) {
    super(props);

    this.onAddNodeClick = this.onAddNodeClick.bind(this);
    this.onNodeTypeChange = this.onNodeTypeChange.bind(this);
  }

  onAddNodeClick(event) {
    this.props.onAddNodeClick();
    event.target.blur();
  }

  onNodeTypeChange(event) {
    this.props.onNodeTypeChange(event.target.value);
    event.target.blur();
  }

  render() {
    const nodeTypes = R.values(this.props.nodeTypes);


    return (
      <div className="CreateNodeWidget">
        <select
          onChange={this.onNodeTypeChange}
          value={this.props.selectedNodeType}
        >
          {nodeTypes.map((type) =>
            <option
              key={type.id}
              value={type.id}
            >
              {type.label || type.id}
            </option>
          )}
        </select>
        <button
          className="button-add-node"
          onClick={this.onAddNodeClick}
          title="Hotkey: N"
        >
          <Icon name="plus" />
        </button>
      </div>
    );
  }
}

CreateNodeWidget.propTypes = {
  nodeTypes: React.PropTypes.object,
  selectedNodeType: React.PropTypes.any,
  onNodeTypeChange: React.PropTypes.func,
  onAddNodeClick: React.PropTypes.func,
};

export default CreateNodeWidget;
