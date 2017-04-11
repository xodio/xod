import R from 'ramda';
import React from 'react';

import Menubar, { itemsPropTypes as menubarItemsPropTypes } from './Menubar';

const renderProjectAuthors = R.compose(
  R.unless(
    R.isEmpty,
    R.concat(' by ')
  ),
  R.join(', ')
);

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
        {renderProjectAuthors(projectAuthors)}
      </span>
    </div>

  </div>
);

Toolbar.propTypes = {
  projectName: React.PropTypes.string.isRequired,
  projectAuthors: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  menuBarItems: menubarItemsPropTypes,
};

export default Toolbar;
