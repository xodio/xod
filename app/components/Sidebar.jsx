import React from 'react';

const Sidebar = ({ children }) => (
  <div className="Sidebar">
    {children}
  </div>
);

Sidebar.propTypes = {
  children: React.PropTypes.arrayOf(React.PropTypes.element),
};

export default Sidebar;
