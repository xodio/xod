import R from 'ramda';
import React from 'react';
import { Icon } from 'react-fa';

import { noop } from '../../utils/ramda';
import { COMMAND } from '../../utils/constants';
import { PROJECT_BROWSER_ERRORS } from '../../messages/constants';
import { POPUP_ID } from '../constants';

import PopupPrompt from '../../utils/components/PopupPrompt';
import PopupConfirm from '../../utils/components/PopupConfirm';

const getPresentPatch = patch => R.propOr(patch, 'present', patch);

class ProjectBrowserToolbar extends React.Component {
  constructor(props) {
    super(props);

    this.onRenamed = this.onRenamed.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    this.onDeleted = this.onDeleted.bind(this);

    this.hotkeys = {};
  }

  componentDidMount() {
    this.props.hotkeys(this.getHotkeyHandlers());
  }

  onRenamed(name) {
    // this.props.closePopup(POPUP_ID.RENAMING); // TODO
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

    // TODO: move logic above into action creator
    this.props.onDeleteClick();
  }

  onDeleted() {
    this.props.onDelete(this.props.selection.type, this.props.selection.id);
  }

  getProjectName() {
    return this.props.projectName;
  }
  getFolderName(id) {
    if (R.not(R.has(id, this.props.folders))) { return ''; }
    return this.props.folders[id].name;
  }
  getPatchName(id) {
    if (R.not(R.has(id, this.props.patches))) { return ''; }
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
      [COMMAND.ADD_PATCH]: this.props.onPatchCreateClick,
      [COMMAND.ADD_FOLDER]: this.props.onFolderCreateClick,
      [COMMAND.RENAME]: this.props.onRenameClick,
      [COMMAND.DELETE]: this.onDeleteClick,
    };
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
        patch => R.propEq('folderId', id)(getPresentPatch(patch))
      )(patches);

      haveChilds = ((folderChilds.length + patchChilds.length) > 0);
    }

    if (type === 'patch') {
      const patches = this.props.patches;
      const patch = getPresentPatch(patches[id]);
      haveChilds = (R.values(patch.nodes).length > 0);
    }

    return !haveChilds;
  }

  renderPopup() {
    if (this.props.openPopups[POPUP_ID.RENAMING]) {
      return this.renderRenamingPopup();
    }
    if (this.props.openPopups[POPUP_ID.DELETING]) {
      return this.renderDeletingPopup();
    }
    if (
      this.props.openPopups[POPUP_ID.CREATING_PATCH] ||
      this.props.openPopups[POPUP_ID.CREATING_FOLDER]
    ) {
      return this.renderCreatingPopup();
    }

    return null;
  }

  renderCreatingPopup() {
    const isCreatingPatch = this.props.openPopups[POPUP_ID.CREATING_PATCH];

    const type = isCreatingPatch ? 'patch' : 'folder';
    const confirmCallback = isCreatingPatch
      ? this.props.onPatchCreate
      : this.props.onFolderCreate;

    return (
      <PopupPrompt
        title={`Create new ${type}`}
        onConfirm={confirmCallback}
        onClose={this.props.closeAllPopups}
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
        onClose={this.props.closeAllPopups}
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
        onClose={this.props.closeAllPopups}
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
        onClick={this.props.onRenameClick}
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
            onClick={this.props.onPatchCreateClick}
          >
            <Icon name="file" />
          </button>
          <button
            title="Add folder"
            onClick={this.props.onFolderCreateClick}
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
  openPopups: React.PropTypes.object,
  currentPatchId: React.PropTypes.string,
  projectName: React.PropTypes.string,
  folders: React.PropTypes.object,
  patches: React.PropTypes.object,
  hotkeys: React.PropTypes.func,

  onPatchCreateClick: React.PropTypes.func.isRequired,
  onPatchCreate: React.PropTypes.func.isRequired,
  onFolderCreateClick: React.PropTypes.func.isRequired,
  onFolderCreate: React.PropTypes.func.isRequired,
  onRenameClick: React.PropTypes.func.isRequired,
  onRename: React.PropTypes.func.isRequired,
  onDeleteClick: React.PropTypes.func.isRequired,
  onDelete: React.PropTypes.func.isRequired,
  onDeleteError: React.PropTypes.func.isRequired,

  closeAllPopups: React.PropTypes.func.isRequired,
};

ProjectBrowserToolbar.defaultProps = {
  selection: null,
  onRename: noop,
  onDelete: noop,
};

export default ProjectBrowserToolbar;
