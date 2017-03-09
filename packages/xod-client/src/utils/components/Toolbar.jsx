import React from 'react';

import UserPanel from '../../user/containers/UserPanel';
import Menubar, { itemsPropTypes as menubarItemsPropTypes } from './Menubar';

const Toolbar = ({ meta, menuBarItems }) => (
  <div className="Toolbar">
    <div className="logo">
      XOD
    </div>

    <Menubar items={menuBarItems} />

    <div className="project-meta">
      <span>
        {meta.name}
      </span>
      <span>
        {(meta.author) ? ` by ${meta.author}` : ''}
      </span>
    </div>

    <UserPanel />
  </div>
);

Toolbar.propTypes = {
  meta: React.PropTypes.object,
  menuBarItems: menubarItemsPropTypes,
};

export default Toolbar;
