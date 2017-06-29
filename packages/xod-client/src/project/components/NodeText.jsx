import React from 'react';
import PropTypes from 'prop-types';

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
  children: PropTypes.string.isRequired,
};

export default NodeText;
