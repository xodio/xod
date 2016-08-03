import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';
import Selectors from '../selectors';

import { findParentByClassName } from '../utils/browser';

import ProjectBrowserTree from '../components/ProjectBrowserTree';
import ProjectBrowserToolbar from '../components/ProjectBrowserToolbar';

class ProjectBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.onTreeChange = this.onTreeChange.bind(this);
    this.onSwitchPatch = this.onSwitchPatch.bind(this);
    this.onMissClick = this.onMissClick.bind(this);
    this.onNodeSelect = this.onNodeSelect.bind(this);
    this.onRename = this.onRename.bind(this);
    this.onDelete = this.onDelete.bind(this);

    this.state = {
      selection: null,
    };
  }

  onNodeSelect(type, id) {
    if (id === null) {
      return this.setState(
        R.assoc('selection', null, this.state)
      );
    }

    return this.setState(
      R.assoc('selection', {
        type,
        id,
      }, this.state)
    );
  }

  onMissClick(event) {
    const treeView = findParentByClassName(event.target, 'inner');
    if (treeView && treeView.parentNode.className === 'm-node') { return; }

    if (this.refs.treeView && this.refs.treeView.deselect) {
      this.refs.treeView.deselect();
    }
  }

  onTreeChange(newTree) {
    console.log('tree changed:', Selectors.Project.parseTreeView(newTree));
  }

  onSwitchPatch(id) {
    this.props.actions.switchPatch(id);
  }

  onDelete(type, id) {
    console.log('DELETE: ', type, id);

    if (type === 'folder') {
      this.props.actions.deleteFolder(id);
    } else {
      this.props.actions.deletePatch(id);
    }
  }

  onRename(type, id, name) {
    if (type === 'folder') {
      this.props.actions.renameFolder(id, name);
    } else {
      this.props.actions.renamePatch(id, name);
    }
  }

  render() {
    return (
      <div
        className="ProjectBrowser"
        onClick={this.onMissClick}
      >
        <small className="title">Project browser</small>
        <ProjectBrowserToolbar
          selection={this.state.selection}
          onDelete={this.onDelete}
          onRename={this.onRename}
        />
        <ProjectBrowserTree
          ref="treeView"
          tree={this.props.tree}
          currentPatchId={this.props.currentPatchId}
          onSelect={this.onNodeSelect}
          onChange={this.onTreeChange}
          onSwitchPatch={this.onSwitchPatch}
        />
      </div>
    );
  }
}

ProjectBrowser.propTypes = {
  tree: React.PropTypes.object.isRequired,
  actions: React.PropTypes.object,
  patches: React.PropTypes.object,
  currentPatchId: React.PropTypes.number,
};

const mapStateToProps = (state) => ({
  tree: Selectors.Project.getTreeView(state),
  patches: Selectors.Project.getPatches(state),
  currentPatchId: Selectors.Editor.getCurrentPatchId(state),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    switchPatch: Actions.switchPatch,
    renameFolder: Actions.renameFolder,
    deleteFolder: Actions.deleteFolder,
    renamePatch: Actions.renamePatch,
    deletePatch: Actions.deletePatch,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser);
