import React from 'react';
import PropTypes from 'prop-types';
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
  onClickAddPatch: PropTypes.func.isRequired,
};

export default ProjectBrowserToolbar;
