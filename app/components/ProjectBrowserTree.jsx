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

    this.setState(R.assoc('active', nodeRef, this.state));
  }

  onDoubleClickNode(node) {
    if (!node.leaf || !node.id) { return; }

    this.props.onSwitchPatch(node.id);
  }

  onChange(tree) {
    this.props.onChange(tree);
  }

  updateTree(tree) {
    this.setState(R.assoc('tree', tree, this.state));
  }

  renderNode(node) {
    const nodeClassName = classNames('node', {
      'is-active': node === this.state.active,
      'is-current': (node.hasOwnProperty('leaf') && node.id === this.props.currentPatchId),
    });

    const onClick = this.onClickNode.bind(this, node);
    const onDblClick = this.onDoubleClickNode.bind(this, node);

    const iconName = (node.leaf) ? 'file-o' :
                     (node.collapsed) ? 'folder-o' :
                     'folder-open-o';

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
  currentPatchId: React.PropTypes.number,
  onChange: React.PropTypes.func,
  onSwitchPatch: React.PropTypes.func,
};

export default ProjectBrowserTree;
