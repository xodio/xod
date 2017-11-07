import React from 'react';
import PropTypes from 'prop-types';

const Workarea = ({ children }) => <div className="Workarea">{children}</div>;

Workarea.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element),
};

export default Workarea;
