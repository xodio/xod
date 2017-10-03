import React from 'react';
import PropTypes from 'prop-types';

const NodeLabel = ({ text, ...props }) => (
  <foreignObject {...props}>
    <div className="nodeLabelContainer" xmlns="http://www.w3.org/1999/xhtml">
      <span className="nodeLabel">{text}</span>
    </div>
  </foreignObject>
);

NodeLabel.propTypes = {
  text: PropTypes.string.isRequired,
};

export default NodeLabel;
