import React from 'react';
import PropTypes from 'prop-types';

const Sidebar = ({ children }) => (
  <div className="Sidebar">
    {children}
  </div>
);

Sidebar.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element),
};

export default Sidebar;
