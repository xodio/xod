import React from 'react';
import PropTypes from 'prop-types';

const TabsContainer = ({ children }) => (
  <ul className="TabsContainer">
    {children}
  </ul>
);

TabsContainer.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]),
};

export default TabsContainer;
