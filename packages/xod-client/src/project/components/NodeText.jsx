import React from 'react';

const NodeText = ({ children }) => (
  <text
    className="NodeText"
    x="50%"
    y="50%"
    textAnchor="middle"
  >
    {children}
  </text>
);

NodeText.propTypes = {
  children: React.PropTypes.string.isRequired,
};

export default NodeText;
