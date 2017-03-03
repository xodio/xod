import React from 'react';
import R from 'ramda';
import { Icon } from 'react-fa';

// :: nodeTypes{} -> nodeTypes[]
const sortNodeTypes = R.compose(
  R.sort(R.comparator((a, b) => a.id < b.id)),
  R.values
);

class CreateNodeWidget extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onAddNodeClick = this.onAddNodeClick.bind(this);
    this.onNodeTypeChange = this.onNodeTypeChange.bind(this);
    this.renderNodeTypes = this.renderNodeTypes.bind(this);
    this.updateSelectedNodeType = this.updateSelectedNodeType.bind(this);
  }

  componentDidMount() {
    this.updateSelectedNodeType();
  }

  componentDidUpdate() {
    const nodeTypeListHasNotSelectedNodeType = (
      this.props.selectedNodeType !== null &&
      R.not(R.has(this.props.selectedNodeType, this.props.nodeTypes))
    );
    if (nodeTypeListHasNotSelectedNodeType) { this.updateSelectedNodeType(); }
  }

  onAddNodeClick(event) {
    this.props.onAddNodeClick();
    event.target.blur();
  }

  onNodeTypeChange(event) {
    this.props.onNodeTypeChange(event.target.value);
    event.target.blur();
  }

  getNodeTypes() {
    return sortNodeTypes(this.props.nodeTypes);
  }

  updateSelectedNodeType() {
    const firstNodeType = this.getNodeTypes()[0];
    this.props.onNodeTypeChange(firstNodeType.id);
  }

  renderNodeTypes() {
    const nodeTypes = this.getNodeTypes();
    return nodeTypes.map(type => (
      <option
        key={type.id}
        value={type.id}
      >
        {type.path || type.id}
      </option>
    ));
  }

  render() {
    return (
      <div className="CreateNodeWidget">
        <select
          onChange={this.onNodeTypeChange}
          value={this.props.selectedNodeType}
        >
          {this.renderNodeTypes()}
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
