import R from 'ramda';
import React from 'react';

import { noop } from '../../utils/ramda';
import { POPUP_ID } from '../constants';

import PopupPrompt from '../../utils/components/PopupPrompt';
import PopupConfirm from '../../utils/components/PopupConfirm';

class ProjectBrowserToolbar extends React.Component {
  constructor(props) {
    super(props);

    this.onRenamed = this.onRenamed.bind(this);
    this.onDeleted = this.onDeleted.bind(this);
  }

  onRenamed(name) {
    this.props.onRename(
      this.props.selection.type,
      this.props.selection.id,
      name
    );
  }

  onDeleted() {
    this.props.onDelete(this.props.selection.type, this.props.selection.id);
  }

  getProjectName() {
    return this.props.projectName;
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
    const { id, type } = this.props.selection;

    const name = (id === null)
      ? this.getProjectName()
      : this.getPatchName(id);

    return {
      type,
      id,
      name,
    };
  }

  renderCreatingPopup() {
    return (
      <PopupPrompt
        title="Create new patch"
        onConfirm={this.props.onPatchCreate}
        onClose={this.props.closeAllPopups}
      >
        Type the name for new patch:
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

  render() {
    if (this.props.openPopups[POPUP_ID.RENAMING]) {
      return this.renderRenamingPopup();
    }
    if (this.props.openPopups[POPUP_ID.DELETING]) {
      return this.renderDeletingPopup();
    }
    if (this.props.openPopups[POPUP_ID.CREATING_PATCH]) {
      return this.renderCreatingPopup();
    }

    return null;
  }
}

ProjectBrowserToolbar.propTypes = {
  selection: React.PropTypes.object,
  openPopups: React.PropTypes.object,
  projectName: React.PropTypes.string,
  patches: React.PropTypes.object,

  onPatchCreate: React.PropTypes.func.isRequired,
  onRename: React.PropTypes.func.isRequired,
  onDelete: React.PropTypes.func.isRequired,

  closeAllPopups: React.PropTypes.func.isRequired,
};

ProjectBrowserToolbar.defaultProps = {
  selection: null,
  onRename: noop,
  onDelete: noop,
};

export default ProjectBrowserToolbar;
