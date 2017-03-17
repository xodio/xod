import React from 'react';

import UserPanel from '../../user/containers/UserPanel';
import Menubar, { itemsPropTypes as menubarItemsPropTypes } from './Menubar';

const Toolbar = ({ projectName, projectAuthors, menuBarItems }) => (
  <div className="Toolbar">
    <div className="logo">
      XOD
    </div>

    <Menubar items={menuBarItems} />

    <div className="project-meta">
      <span>
        {projectName}
      </span>
      <span>
        {(projectAuthors.length) ? ` by ${projectAuthors.join(', ')}` : ''}
      </span>
    </div>

    <UserPanel />
  </div>
);

Toolbar.propTypes = {
  projectName: React.PropTypes.string.isRequired,
  projectAuthors: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  menuBarItems: menubarItemsPropTypes,
};

export default Toolbar;
