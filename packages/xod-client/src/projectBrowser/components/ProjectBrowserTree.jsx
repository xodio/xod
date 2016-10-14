import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import Tree from 'react-ui-tree';
import { Icon } from 'react-fa';


class ProjectBrowserTree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: null,
      tree: props.tree,
    };

    this.onClickNode = this.onClickNode.bind(this);
    this.onChange = this.onChange.bind(this);
    this.renderNode = this.renderNode.bind(this);
    this.deselect = this.deselect.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.tree !== this.state.tree) {
      this.updateTree(nextProps.tree);
    }
  }

  onClickNode(node) {
    const nodeRef = node;
    if (!node.hasOwnProperty('leaf')) {
      nodeRef.collapsed = !nodeRef.collapsed;
    }
    this.setActive(nodeRef);
  }

  onDoubleClickNode(node) {
    if (!node.leaf || !node.id) { return; }

    this.props.onSwitchPatch(node.id);
  }

  onChange(tree) {
    this.props.onChange(tree);
  }

  getActiveData(val) {
    let selected = {
      type: null,
      id: null,
    };

    if (val !== null) {
      let type = 'project';
      if (val.id > 0) { type = (val.leaf) ? 'patch' : 'folder'; }

      selected = {
        type,
        id: (val.id !== undefined) ? val.id : null,
      };
    }

    return selected;
  }

  setActive(val) {
    const selected = this.getActiveData(val);

    this.setState(R.assoc('active', selected, this.state));
    this.props.onSelect(selected.type, selected.id);
  }

  updateTree(tree) {
    this.setState(R.assoc('tree', tree, this.state));
  }

  deselect() {
    this.setActive(null);
  }

  isNodeActive(node) {
    const thatNode = this.getActiveData(node);

    return (
      thatNode && this.state.active &&
      thatNode.id === this.state.active.id &&
      thatNode.type === this.state.active.type
    );
  }

  isNodeCurrent(node) {
    return (
      node.hasOwnProperty('leaf') &&
      node.id === this.props.currentPatchId
    );
  }

  renderNode(node) {
    const nodeClassName = classNames('node', {
      'is-active': this.isNodeActive(node),
      'is-current': this.isNodeCurrent(node),
    });

    const onClick = this.onClickNode.bind(this, node);
    const onDblClick = this.onDoubleClickNode.bind(this, node);

    let iconName = 'folder-open-o';
    if (node.leaf) { iconName = 'file-o'; }
    if (node.collapsed) { iconName = 'folder-o'; }

    return (
      <span
        className={nodeClassName}
        onClick={onClick}
        onDoubleClick={onDblClick}
      >
        <Icon name={iconName} className="icon" />
        {node.module}
      </span>
    );
  }

  render() {
    return (
      <div className="ProjectBrowserTree">
        <Tree
          tree={this.state.tree}
          renderNode={this.renderNode}
          onChange={this.onChange}
        />
      </div>
    );
  }
}

ProjectBrowserTree.propTypes = {
  tree: React.PropTypes.object.isRequired,
  currentPatchId: React.PropTypes.string,
  onSelect: React.PropTypes.func,
  onChange: React.PropTypes.func,
  onSwitchPatch: React.PropTypes.func,
};

export default ProjectBrowserTree;
