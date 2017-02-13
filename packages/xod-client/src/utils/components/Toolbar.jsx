import React from 'react';

import CreateNodeWidget from '../../editor/components/CreateNodeWidget';
import UserPanel from '../../user/containers/UserPanel';
import Menubar, { propTypes as menubarPropTypes } from './Menubar';

const Toolbar = ({
  meta,
  menuBarItems,
  nodeTypes,
  selectedNodeType,
  onSelectNodeType,
  onAddNodeClick,
}) => (
  <div className="Toolbar">
    <CreateNodeWidget
      nodeTypes={nodeTypes}
      selectedNodeType={selectedNodeType}
      onNodeTypeChange={onSelectNodeType}
      onAddNodeClick={onAddNodeClick}
    />

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
  nodeTypes: React.PropTypes.object,
  selectedNodeType: React.PropTypes.string,
  onSelectNodeType: React.PropTypes.func,
  onAddNodeClick: React.PropTypes.func,
  menuBarItems: menubarPropTypes,
};

export default Toolbar;
