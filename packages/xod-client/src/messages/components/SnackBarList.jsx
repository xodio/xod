import React from 'react';
import PropTypes from 'prop-types';

const SnackBarList = ({ onMouseOver, onMouseOut, children }) => (
  <ul
    className="SnackBarList"
    onMouseOver={onMouseOver}
    onMouseOut={onMouseOut}
  >
    {children}
  </ul>
);

SnackBarList.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element),
  onMouseOver: PropTypes.func,
  onMouseOut: PropTypes.func,
};

export default SnackBarList;
