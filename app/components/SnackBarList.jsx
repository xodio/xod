import React from 'react';

const SnackBarList = ({ children }) => (
  <ul className="SnackBarList">
    {children}
  </ul>
);

SnackBarList.propTypes = {
  children: React.PropTypes.arrayOf(React.PropTypes.element),
};

export default SnackBarList;
