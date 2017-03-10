import React from 'react';
import { Icon } from 'react-fa';

const ProjectBrowserToolbar = ({ onClickAddPatch }) => (
  <div className="ProjectBrowserToolbar">
    <div className="ProjectBrowserToolbar-left">
      <button
        title="Add patch"
        onClick={onClickAddPatch}
      >
        <Icon name="file" />
      </button>
    </div>
  </div>
);

ProjectBrowserToolbar.displayName = 'ProjectBrowserToolbar';

ProjectBrowserToolbar.propTypes = {
  onClickAddPatch: React.PropTypes.func.isRequired,
};

export default ProjectBrowserToolbar;
