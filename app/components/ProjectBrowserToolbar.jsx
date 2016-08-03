import React from 'react';
import { Icon } from 'react-fa';

const ProjectBrowserToolbar = () => (
  <div className="ProjectBrowserToolbar">
    <div className="ProjectBrowserToolbar-left">
      <button title="Add patch">
        <Icon name="file" />
      </button>
      <button title="Add folder">
        <Icon name="folder" />
      </button>
    </div>
    <div className="ProjectBrowserToolbar-right">
      <button title="Rename patch or folder">
        <Icon name="pencil-square" />
      </button>
      <button title="Delete patch or folder">
        <Icon name="trash" />
      </button>
    </div>
  </div>
);

export default ProjectBrowserToolbar;
