import React from 'react';
import { Icon } from 'react-fa';

const ProjectBrowserToolbar = ({ selection, onRename, onDelete }) => {
  let actionsWithSelected = null;

  if (selection) {
    const type = selection.type;

    const onRenameClick = () => {
      if (window && window.prompt) {
        onRename(
          selection.type,
          selection.id,
          prompt(`Type a new name for selected ${type}`) // @TODO: Replace with UI
        );
      }
    };

    const onDeleteClick = () => {
      onDelete(selection.type, selection.id);
    };

    actionsWithSelected = (
      <div className="ProjectBrowserToolbar-right">
        <button
          title={`Rename ${type}`}
          onClick={onRenameClick}
        >
          <Icon name="pencil-square" />
        </button>
        <button
          title={`Delete ${type}`}
          onClick={onDeleteClick}
        >
          <Icon name="trash" />
        </button>
      </div>
    );
  }

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
    </div>
  );
};

ProjectBrowserToolbar.propTypes = {
  selection: React.PropTypes.object,
  onRename: React.PropTypes.func,
  onDelete: React.PropTypes.func,
};

ProjectBrowserToolbar.defaultProps = {
  selection: null,
  onRename: f => f,
  onDelete: f => f,
};

export default ProjectBrowserToolbar;
