import React from 'react';

const TabsContainer = ({ children }) => (
  <ul className="TabsContainer">
    {children}
  </ul>
);

TabsContainer.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.element,
    React.PropTypes.arrayOf(React.PropTypes.element),
  ]),
};

export default TabsContainer;
