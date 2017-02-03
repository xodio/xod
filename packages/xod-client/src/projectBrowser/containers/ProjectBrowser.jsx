import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';
import core from 'xod-core';

import * as MessageActions from '../../messages/actions';
import * as ProjectActions from '../../project/actions';
import * as ProjectBrowserActions from '../../projectBrowser/actions';
import * as EditorActions from '../../editor/actions';
import * as EditorSelectors from '../../editor/selectors';
import { COMMAND } from '../../utils/constants';
import { findParentByClassName } from '../../utils/browser';

import ProjectBrowserTree from '../components/ProjectBrowserTree';
import ProjectBrowserToolbar from '../components/ProjectBrowserToolbar';

class ProjectBrowser extends React.Component {
  static isMissClicked(event) {
    const treeView = findParentByClassName(event.target, 'inner');
    return (
      (treeView && treeView.parentNode.className === 'm-node') ||
      findParentByClassName(event.target, 'ProjectBrowserToolbar')
    );
  }

  constructor(props) {
    super(props);

    this.treeView = null;
    this.toolbar = null;

    this.assignToolbar = this.assignToolbar.bind(this);
    this.assignTreeView = this.assignTreeView.bind(this);

    this.onTreeChange = this.onTreeChange.bind(this);
    this.onSwitchPatch = this.onSwitchPatch.bind(this);
    this.onMissClick = this.onMissClick.bind(this);
    this.onNodeSelect = this.onNodeSelect.bind(this);
    this.onRename = this.onRename.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onPatchCreate = this.onPatchCreate.bind(this);
    this.onFolderCreate = this.onFolderCreate.bind(this);
    this.onToolbarHotkeys = this.onToolbarHotkeys.bind(this);
    this.deselect = this.deselect.bind(this);

    this.getHotkeyHandlers = this.getHotkeyHandlers.bind(this);

    this.state = {
      selection: null,
    };

    this.hotkeys = {};
    this.oldTree = R.clone(props.tree);
  }

  componentDidMount() {
    this.setHotkeys(this.getHotkeyHandlers());
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.tree !== this.oldTree) {
      this.oldTree = nextProps.tree;
    }
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
    if (ProjectBrowser.isMissClicked(event)) { return; }

    this.deselect();
  }

  onTreeChange(newTree) {
    const oldTree = this.oldTree;
    const treeChanges = core.getTreeChanges(oldTree, newTree);

    const dispatchChange = (array, action) => {
      array.forEach(item => action(item));
    };

    if (treeChanges.changed) {
      dispatchChange(treeChanges.folders, this.props.actions.moveFolder);
      dispatchChange(treeChanges.patches, this.props.actions.movePatch);
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
    this.state.selection = null;
  }

  onRename(type, id, name) {
    if (type === 'folder') {
      this.props.actions.renameFolder(id, name);
    } else if (type === 'patch') {
      this.props.actions.renamePatch(id, name);
    } else {
      this.props.actions.renameProject(name);
    }
  }

  onToolbarHotkeys(hotkeys) {
    this.hotkeys = hotkeys;
  }

  setHotkeys(hotkeys) {
    this.hotkeys = hotkeys;
  }

  getPatchFolderId(id) {
    if (R.not(R.has(id, this.props.patches))) { return ''; }
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

  getHotkeyHandlers() {
    return R.merge(
      {
        [COMMAND.ESCAPE]: this.deselect,
      },
      this.hotkeys
    );
  }

  deselect() {
    if (this.canBeDeselected() && this.treeView) {
      this.treeView.deselect();
    }
  }

  canBeDeselected() {
    return (
      !(
        this.toolbar &&
        (
          this.toolbar.getState('renaming') ||
          this.toolbar.getState('deleting') ||
          this.toolbar.getState('creatingPatch') ||
          this.toolbar.getState('creatingFolder') ||
          this.state.selection === null
        )
      ) &&
      (
        this.treeView && this.treeView.deselect
      )
    );
  }

  assignToolbar(ref) {
    this.toolbar = ref;
  }
  assignTreeView(ref) {
    this.treeView = ref;
  }

  render() {
    return (
      <HotKeys
        handlers={this.getHotkeyHandlers()}
        className="ProjectBrowser"
        onClick={this.onMissClick}
      >
        <small className="title">Project browser</small>
        <ProjectBrowserToolbar
          ref={this.assignToolbar}
          hotkeys={this.onToolbarHotkeys}
          selection={this.state.selection}
          currentPatchId={this.props.currentPatchId}
          openPopups={this.props.openPopups}
          projectName={this.props.projectName}
          patches={this.props.patches}
          folders={this.props.folders}
          onDelete={this.onDelete}
          onRename={this.onRename}
          onPatchCreate={this.onPatchCreate}
          onFolderCreate={this.onFolderCreate}
          onDeleteError={this.props.actions.addMessage}
          openPopup={this.props.actions.openPopup}
          closePopup={this.props.actions.closePopup}
          closeAllPopups={this.props.actions.closeAllPopups}
        />
        <ProjectBrowserTree
          ref={this.assignTreeView}
          tree={this.props.tree}
          currentPatchId={this.props.currentPatchId}
          onSelect={this.onNodeSelect}
          onChange={this.onTreeChange}
          onSwitchPatch={this.onSwitchPatch}
        />
      </HotKeys>
    );
  }
}

ProjectBrowser.propTypes = {
  tree: React.PropTypes.object.isRequired,
  actions: React.PropTypes.object,
  openPopups: React.PropTypes.objectOf(React.PropTypes.bool).isRequired,
  projectName: React.PropTypes.string,
  patches: React.PropTypes.object,
  folders: React.PropTypes.object,
  currentPatchId: React.PropTypes.string,
};

const mapStateToProps = (state) => {
  const project = core.getProject(state);
  const projectMeta = core.getMeta(project);
  const projectName = core.getName(projectMeta);
  const curPatchId = EditorSelectors.getCurrentPatchId(state);

  return {
    tree: core.getTreeView(project, curPatchId),
    projectName,
    patches: core.getPatches(state),
    folders: core.getFolders(state),
    currentPatchId: curPatchId,
    openPopups: state.projectBrowser.openPopups,
  };
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    switchPatch: EditorActions.switchPatch,
    addFolder: ProjectActions.addFolder,
    renameFolder: ProjectActions.renameFolder,
    deleteFolder: ProjectActions.deleteFolder,
    moveFolder: ProjectActions.moveFolder,
    addPatch: ProjectActions.addPatch,
    renamePatch: ProjectActions.renamePatch,
    deletePatch: ProjectActions.deletePatch,
    renameProject: ProjectActions.renameProject,
    movePatch: ProjectActions.movePatch,
    addMessage: MessageActions.addError,
    openPopup: ProjectBrowserActions.openPopup,
    closePopup: ProjectBrowserActions.closePopup,
    closeAllPopups: ProjectBrowserActions.closeAllPopups,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser);
