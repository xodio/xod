import React from 'react';
import R from 'ramda';

const styles = {
  container: {
    position: 'absolute',
    zIndex: 10,
    top: '30px',
    left: 0,
  },
  button: {
    background: '#286AA7',
    color: '#fff',
    textShadow: '0 -1px 0 rgba(0,0,30,0.3)',
    border: 0,
    borderRadius: '2px',
  },
};

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
      <div style={styles.container}>
        <select
          onChange={this.onNodeTypeChange}
          value={this.props.selectedNodeType}
        >
          {nodeTypes.map((type) =>
            <option
              key={type.id}
              value={type.id}
            >
              {type.label}
            </option>
          )}
        </select>
        <button
          className="toolbar-addNodeButton"
          style={styles.button}
          onClick={this.onAddNodeClick}
          title="Hotkey: N"
        >
          + Add node
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
