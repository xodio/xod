import R from 'ramda';
import React from 'react';
import { noop } from '../../utils/ramda';

import { COMMAND } from '../../utils/constants';
import { PROJECT_BROWSER_ERRORS } from '../../messages/constants';

import { Icon } from 'react-fa';
import PopupPrompt from '../../utils/components/PopupPrompt';
import PopupConfirm from '../../utils/components/PopupConfirm';

const initialState = {
  renaming: false,
  deleting: false,
  creatingPatch: false,
  creatingFolder: false,
};

class ProjectBrowserToolbar extends React.Component {
  constructor(props) {
    super(props);

    this.state = R.clone(initialState);

    this.onRenameClick = this.onRenameClick.bind(this);
    this.onRenamed = this.onRenamed.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    this.onDeleted = this.onDeleted.bind(this);
    this.onPopupClosed = this.onPopupClosed.bind(this);
    this.onPatchCreateClick = this.onPatchCreateClick.bind(this);
    this.onPatchCreated = this.onPatchCreated.bind(this);
    this.onFolderCreateClick = this.onFolderCreateClick.bind(this);
    this.onFolderCreated = this.onFolderCreated.bind(this);

    this.hotkeys = {};
  }

  componentDidMount() {
    this.props.hotkeys(this.getHotkeyHandlers());
  }

  onPatchCreateClick() {
    this.setState(R.assoc('creatingPatch', true, this.state));
  }

  onPatchCreated(name) {
    this.setState(R.assoc('creatingPatch', false, this.state));
    this.props.onPatchCreate(name);
  }

  onFolderCreateClick() {
    this.setState(R.assoc('creatingFolder', true, this.state));
  }

  onFolderCreated(name) {
    this.setState(R.assoc('creatingFolder', false, this.state));
    this.props.onFolderCreate(name);
  }

  onRenameClick() {
    this.setState(R.assoc('renaming', true, this.state));
  }

  onRenamed(name) {
    this.setState(R.assoc('renaming', false, this.state));
    this.props.onRename(
      this.props.selection.type,
      this.props.selection.id,
      name
    );
  }

  onDeleteClick() {
    if (this.canBeDeletedWithoutConfirmation()) {
      this.onDeleted();
      return;
    }

    if (
      this.props.selection.type === 'patch' &&
      this.props.selection.id === this.props.currentPatchId
    ) {
      this.props.onDeleteError({ message: PROJECT_BROWSER_ERRORS.CANT_DELETE_CURRENT_PATCH });
      return;
    }

    this.setState(R.assoc('deleting', true, this.state));
  }

  onDeleted() {
    this.setState(R.assoc('deleting', false, this.state));
    this.props.onDelete(this.props.selection.type, this.props.selection.id);
  }

  onPopupClosed() {
    this.setState(R.merge(this.state, initialState));
  }

  getProjectName() {
    return this.props.projectName;
  }
  getFolderName(id) {
    if (!this.props.folders.hasOwnProperty(id)) { return ''; }
    return this.props.folders[id].name;
  }
  getPatchName(id) {
    if (!this.props.patches.hasOwnProperty(id)) { return ''; }
    const patch = this.props.patches[id];

    return R.pipe(
      R.propOr(patch, 'present'),
      R.prop('label')
    )(patch);
  }

  getSelectionInfo() {
    if (this.props.selection === null) { return null; }
    const type = this.props.selection.type;
    const id = this.props.selection.id;
    let name = this.getProjectName();
    if (id !== 0) {
      name = (type === 'folder') ? this.getFolderName(id) : this.getPatchName(id);
    }

    return {
      type,
      id,
      name,
    };
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.ADD_PATCH]: this.onPatchCreateClick,
      [COMMAND.ADD_FOLDER]: this.onFolderCreateClick,
      [COMMAND.RENAME]: this.onRenameClick,
      [COMMAND.DELETE]: this.onDeleteClick,
    };
  }

  getPresentPatch(patch) {
    return R.propOr(patch, 'present', patch);
  }

  getState(key) {
    return this.state[key];
  }

  getActionButtons(selection) {
    let buttonRenderers = ['renderRenameButton', 'renderDeleteButton'];

    if (selection.type === 'project') {
      buttonRenderers = R.reject(R.equals('renderDeleteButton'), buttonRenderers);
    }

    return R.map(method => this[method](selection), buttonRenderers);
  }

  canBeDeletedWithoutConfirmation() {
    const type = this.props.selection.type;
    const id = this.props.selection.id;
    let haveChilds = false;

    if (type === 'folder') {
      const folders = R.values(this.props.folders);
      const patches = R.values(this.props.patches);
      const folderChilds = R.filter(R.propEq('parentId', id))(folders);
      const patchChilds = R.filter(
        patch => R.propEq('folderId', id)(this.getPresentPatch(patch))
      )(patches);

      haveChilds = ((folderChilds.length + patchChilds.length) > 0);
    }

    if (type === 'patch') {
      const patches = this.props.patches;
      const patch = this.getPresentPatch(patches[id]);
      haveChilds = (R.values(patch.nodes).length > 0);
    }

    return !haveChilds;
  }

  renderPopup() {
    if (this.state.renaming) {
      return this.renderRenamingPopup();
    }
    if (this.state.deleting) {
      return this.renderDeletingPopup();
    }
    if (this.state.creatingPatch || this.state.creatingFolder) {
      return this.renderCreatingPopup();
    }

    return null;
  }

  renderCreatingPopup() {
    const type = (this.state.creatingPatch) ? 'patch' : 'folder';
    const confirmCallback = (this.state.creatingPatch) ? this.onPatchCreated : this.onFolderCreated;

    return (
      <PopupPrompt
        title={`Create new ${type}`}
        onConfirm={confirmCallback}
        onClose={this.onPopupClosed}
      >
        Type the name for new {type}:
      </PopupPrompt>
    );
  }

  renderRenamingPopup() {
    const selection = this.getSelectionInfo();

    return (
      <PopupPrompt
        title={`Rename the ${selection.type}`}
        onConfirm={this.onRenamed}
        onClose={this.onPopupClosed}
      >
        Type new name for {selection.type} &laquo;{selection.name}&raquo;:
      </PopupPrompt>
    );
  }

  renderDeletingPopup() {
    const selection = this.getSelectionInfo();

    return (
      <PopupConfirm
        title={`Delete the ${selection.type}`}
        onConfirm={this.onDeleted}
        onClose={this.onPopupClosed}
      >
        Are you sure you want to delete {selection.type} &laquo;{selection.name}&raquo;?
      </PopupConfirm>
    );
  }

  renderRenameButton(selection) {
    return (
      <button
        key={`${selection.id}_rename`}
        title={`Rename ${selection.type}`}
        onClick={this.onRenameClick}
      >
        <Icon name="pencil-square" />
      </button>
    );
  }

  renderDeleteButton(selection) {
    return (
      <button
        key={`${selection.id}_delete`}
        title={`Delete ${selection.type}`}
        onClick={this.onDeleteClick}
      >
        <Icon name="trash" />
      </button>
    );
  }

  renderActionsWithSelected() {
    if (!this.props.selection) { return null; }

    const selection = this.getSelectionInfo();
    const buttons = this.getActionButtons(selection);

    return (
      <div className="ProjectBrowserToolbar-right">
        {buttons}
      </div>
    );
  }

  render() {
    const actionsWithSelected = this.renderActionsWithSelected();
    const popup = this.renderPopup();

    return (
      <div className="ProjectBrowserToolbar">
        <div className="ProjectBrowserToolbar-left">
          <button
            title="Add patch"
            onClick={this.onPatchCreateClick}
          >
            <Icon name="file" />
          </button>
          <button
            title="Add folder"
            onClick={this.onFolderCreateClick}
          >
            <Icon name="folder" />
          </button>
        </div>
        {actionsWithSelected}
        {popup}
      </div>
    );
  }
}

ProjectBrowserToolbar.propTypes = {
  selection: React.PropTypes.object,
  currentPatchId: React.PropTypes.string,
  projectName: React.PropTypes.string,
  folders: React.PropTypes.object,
  patches: React.PropTypes.object,
  onRename: React.PropTypes.func,
  onDelete: React.PropTypes.func,
  onPatchCreate: React.PropTypes.func,
  onFolderCreate: React.PropTypes.func,
  hotkeys: React.PropTypes.func,
  onDeleteError: React.PropTypes.func,
};

ProjectBrowserToolbar.defaultProps = {
  selection: null,
  onRename: noop,
  onDelete: noop,
};

export default ProjectBrowserToolbar;
