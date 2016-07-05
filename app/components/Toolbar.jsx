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
    borderRadius: 0,
    borderTopRightRadius: '2px',
    borderBottomRightRadius: '2px',
  },
};

class Toolbar extends React.Component {
  constructor(props) {
    super(props);

    this.onAddNodeClick = this.onAddNodeClick.bind(this);
    this.onNodeTypeChange = this.onNodeTypeChange.bind(this);
  }
  onAddNodeClick() {
    this.props.onAddNodeClick();
  }
  onNodeTypeChange(event) {
    this.props.onNodeTypeChange(event.target.value);
  }
  render() {
    const nodeTypes = R.values(this.props.nodeTypes);


    return (
      <div style={styles.container}>
        <select onChange={this.onNodeTypeChange}>
          {nodeTypes.map((type) =>
            <option
              key={type.id}
              value={type.id}
              selected={type.id === this.props.selectedNodeType}
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

Toolbar.propTypes = {
  nodeTypes: React.PropTypes.object,
  selectedNodeType: React.PropTypes.number,
  onNodeTypeChange: React.PropTypes.func,
  onAddNodeClick: React.PropTypes.func,
};

export default Toolbar;
