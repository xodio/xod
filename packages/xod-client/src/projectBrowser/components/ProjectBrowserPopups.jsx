import React from 'react';

import { isValidIdentifier, IDENTIFIER_RULES } from 'xod-project';

import { POPUP_ID } from '../constants';

import PopupPrompt from '../../utils/components/PopupPrompt';
import PopupConfirm from '../../utils/components/PopupConfirm';
import { lowercaseKebabMask } from '../../utils/inputFormatting';

class ProjectBrowserPopups extends React.Component {
  constructor(props) {
    super(props);

    this.onPatchDeleteConfirmed = this.onPatchDeleteConfirmed.bind(this);
    this.onPatchRenameConfirmed = this.onPatchRenameConfirmed.bind(this);
  }

  onPatchDeleteConfirmed() {
    this.props.onPatchDelete(this.props.selectedPatchPath);
  }

  onPatchRenameConfirmed(name) {
    this.props.onPatchRename(this.props.selectedPatchPath, name);
  }

  getProjectName() {
    return this.props.projectName;
  }

  getSelectedPatchName() {
    return this.props.selectedPatchName;
  }

  renderPatchCreatingPopup() {
    return (
      <PopupPrompt
        key="new_patch"
        title="Create new patch"
        onConfirm={this.props.onPatchCreate}
        onClose={this.props.onCloseAllPopups}
        inputMask={lowercaseKebabMask}
        inputValidator={isValidIdentifier}
        helpText={IDENTIFIER_RULES}
      >
        Type the name for new patch:
      </PopupPrompt>
    );
  }

  renderPatchRenamingPopup() {
    const selectedPatchName = this.getSelectedPatchName();

    return (
      <PopupPrompt
        key="rename_patch"
        title="Rename patch"
        onConfirm={this.onPatchRenameConfirmed}
        onClose={this.props.onCloseAllPopups}
        inputMask={lowercaseKebabMask}
        inputValidator={isValidIdentifier}
        helpText={IDENTIFIER_RULES}
      >
        Type new name for patch &laquo;{selectedPatchName}&raquo;:
      </PopupPrompt>
    );
  }

  renderProjectRenamingPopup() {
    const currentProjectName = this.getProjectName();

    return (
      <PopupPrompt
        key="rename_project"
        title="Rename project"
        onConfirm={this.props.onProjectRename}
        onClose={this.props.onCloseAllPopups}
        inputMask={lowercaseKebabMask}
        inputValidator={isValidIdentifier}
        helpText={IDENTIFIER_RULES}
      >
        Type new name for project &laquo;{currentProjectName}&raquo;:
      </PopupPrompt>
    );
  }

  renderPatchDeletingPopup() {
    const selectedPatchName = this.getSelectedPatchName();

    return (
      <PopupConfirm
        key="delete_patch"
        title="Delete the patch"
        onConfirm={this.onPatchDeleteConfirmed}
        onClose={this.props.onCloseAllPopups}
      >
        Are you sure you want to delete patch &laquo;{selectedPatchName}&raquo;?
      </PopupConfirm>
    );
  }

  render() {
    if (this.props.openPopups[POPUP_ID.RENAMING_PATCH]) {
      return this.renderPatchRenamingPopup();
    }
    if (this.props.openPopups[POPUP_ID.DELETING_PATCH]) {
      return this.renderPatchDeletingPopup();
    }
    if (this.props.openPopups[POPUP_ID.CREATING_PATCH]) {
      return this.renderPatchCreatingPopup();
    }

    if (this.props.openPopups[POPUP_ID.RENAMING_PROJECT]) {
      return this.renderProjectRenamingPopup();
    }

    return null;
  }
}

ProjectBrowserPopups.propTypes = {
  selectedPatchPath: React.PropTypes.string,
  selectedPatchName: React.PropTypes.string,
  openPopups: React.PropTypes.object,
  projectName: React.PropTypes.string,

  onPatchCreate: React.PropTypes.func.isRequired,
  onProjectRename: React.PropTypes.func.isRequired,
  onPatchRename: React.PropTypes.func.isRequired,
  onPatchDelete: React.PropTypes.func.isRequired,

  onCloseAllPopups: React.PropTypes.func.isRequired,
};

ProjectBrowserPopups.defaultProps = {
  selectedPatchPath: null,
};

export default ProjectBrowserPopups;
