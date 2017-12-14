import React from 'react';
import PropTypes from 'prop-types';

const ProjectBrowserToolbar = ({ onClickAddPatch, onClickAddLibrary }) => (
  <div className="ProjectBrowserToolbar">
    <div className="ProjectBrowserToolbar-title">
      Project Browser
    </div>
    <div className="ProjectBrowserToolbar-buttons">
      <button
        className="newpatch"
        title="Add patch"
        onClick={onClickAddPatch}
      />
      <button
        className="addlib"
        title="Add library"
        onClick={onClickAddLibrary}
      />
    </div>
  </div>
);

ProjectBrowserToolbar.displayName = 'ProjectBrowserToolbar';

ProjectBrowserToolbar.propTypes = {
  onClickAddPatch: PropTypes.func.isRequired,
  onClickAddLibrary: PropTypes.func.isRequired,
};

export default ProjectBrowserToolbar;
