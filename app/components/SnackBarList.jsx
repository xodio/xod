import React from 'react';

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
  children: React.PropTypes.arrayOf(React.PropTypes.element),
  onMouseOver: React.PropTypes.func,
  onMouseOut: React.PropTypes.func,
};

export default SnackBarList;
