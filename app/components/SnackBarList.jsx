import React from 'react';

const SnackBarList = ({ children }) => (
  <ul className="SnackBar-List">
    {children}
  </ul>
);

SnackBarList.propTypes = {
  children: React.PropTypes.arrayOf(React.PropTypes.element),
};

export default SnackBarList;
