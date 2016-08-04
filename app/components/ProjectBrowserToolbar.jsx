import R from 'ramda';
import React from 'react';
import { Icon } from 'react-fa';

import PopupPrompt from '../components/PopupPrompt';
import PopupConfirm from '../components/PopupConfirm';

class ProjectBrowserToolbar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      renaming: false,
      deleting: false,
      creating: false,
    };

    this.onRenameClick = this.onRenameClick.bind(this);
    this.onRenamed = this.onRenamed.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    this.onDeleted = this.onDeleted.bind(this);
    this.onPopupClosed = this.onPopupClosed.bind(this);
  }

  onRenameClick() {
    this.setState(
      R.assoc('renaming', true, this.state)
    );
  }

  onRenamed(name) {
    this.setState(
      R.assoc('renaming', false, this.state)
    );

    this.props.onRename(
      this.props.selection.type,
      this.props.selection.id,
      name
    );
  }

  onDeleteClick() {
    this.setState(
      R.assoc('deleting', true, this.state)
    );
  }

  onDeleted() {
    this.setState(
      R.assoc('deleting', false, this.state)
    );

    this.props.onDelete(this.props.selection.type, this.props.selection.id);
  }

  onPopupClosed() {
    this.setState(
      R.merge(this.state, {
        renaming: false,
        deleting: false,
      })
    );
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
      R.prop('name')
    )(patch);
  }

  getSelectionInfo() {
    if (this.props.selection === null) { return null; }
    const type = this.props.selection.type;
    const id = this.props.selection.id;
    const name = (type === 'folder') ? this.getFolderName(id) : this.getPatchName(id);

    return {
      type,
      id,
      name,
    };
  }

  renderPopup() {
    if (this.state.renaming) {
      return this.renderRenamingPopup();
    }
    if (this.state.deleting) {
      return this.renderDeletingPopup();
    }

    return null;
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

  renderActionsWithSelected() {
    if (!this.props.selection) { return null; }

    const selection = this.getSelectionInfo();

    return (
      <div className="ProjectBrowserToolbar-right">
        <button
          title={`Rename ${selection.type}`}
          onClick={this.onRenameClick}
        >
          <Icon name="pencil-square" />
        </button>
        <button
          title={`Delete ${selection.type}`}
          onClick={this.onDeleteClick}
        >
          <Icon name="trash" />
        </button>
      </div>
    );
  }

  render() {
    const actionsWithSelected = this.renderActionsWithSelected();
    const popup = this.renderPopup();

    return (
      <div className="ProjectBrowserToolbar">
        <div className="ProjectBrowserToolbar-left">
          <button title="Add patch">
            <Icon name="file" />
          </button>
          <button title="Add folder">
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
  folders: React.PropTypes.object,
  patches: React.PropTypes.object,
  onRename: React.PropTypes.func,
  onDelete: React.PropTypes.func,
};

ProjectBrowserToolbar.defaultProps = {
  selection: null,
  onRename: f => f,
  onDelete: f => f,
};

export default ProjectBrowserToolbar;
