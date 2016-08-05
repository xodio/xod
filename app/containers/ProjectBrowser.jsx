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
    this.onPatchCreate = this.onPatchCreate.bind(this);
    this.onFolderCreate = this.onFolderCreate.bind(this);

    this.state = {
      selection: null,
      renaming: false,
      deleting: false,
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
    if (
      treeView && treeView.parentNode.className === 'm-node' ||
      findParentByClassName(event.target, 'ProjectBrowserToolbar')
    ) { return; }

    if (this.refs.treeView && this.refs.treeView.deselect) {
      this.refs.treeView.deselect();
    }
  }

  onTreeChange(newTree) {
    const oldTree = this.props.tree;
    const treeChanges = Selectors.Project.getTreeChanges(oldTree, newTree);

    if (treeChanges.changed) {
      
    }
  }

  onSwitchPatch(id) {
    this.props.actions.switchPatch(id);
  }

  onPatchCreate(name) {
    const folderId = this.getFolderId();
    this.props.actions.addPatch(name, folderId);
  }

  onFolderCreate(name) {
    const folderId = this.getFolderId();
    this.props.actions.addFolder(name, folderId);
  }

  onDelete(type, id) {
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

  getPatchFolderId(id) {
    if (!this.props.patches.hasOwnProperty(id)) { return ''; }
    const patch = this.props.patches[id];

    return R.pipe(
      R.propOr(patch, 'present'),
      R.prop('folderId')
    )(patch);
  }

  getFolderId() {
    if (this.state.selection === null) { return null; }

    if (this.state.selection.type === 'folder') {
      return this.state.selection.id;
    }

    return this.getPatchFolderId(this.state.selection.id);
  }

  render() {
    const tree = R.clone(this.props.tree);
    return (
      <div
        className="ProjectBrowser"
        onClick={this.onMissClick}
      >
        <small className="title">Project browser</small>
        <ProjectBrowserToolbar
          selection={this.state.selection}
          patches={this.props.patches}
          folders={this.props.folders}
          onDelete={this.onDelete}
          onRename={this.onRename}
          onPatchCreate={this.onPatchCreate}
          onFolderCreate={this.onFolderCreate}
        />
        <ProjectBrowserTree
          ref="treeView"
          tree={tree}
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
  folders: React.PropTypes.object,
  currentPatchId: React.PropTypes.number,
};

const mapStateToProps = (state) => ({
  tree: Selectors.Project.getTreeView(state),
  patches: Selectors.Project.getPatches(state),
  folders: Selectors.Project.getFolders(state),
  currentPatchId: Selectors.Editor.getCurrentPatchId(state),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    switchPatch: Actions.switchPatch,
    addFolder: Actions.addFolder,
    renameFolder: Actions.renameFolder,
    deleteFolder: Actions.deleteFolder,
    addPatch: Actions.addPatch,
    renamePatch: Actions.renamePatch,
    deletePatch: Actions.deletePatch,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser);
