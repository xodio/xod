import React from 'react';
import PropTypes from 'prop-types';

function SVGLayer({ name, className, children }) {
  return (
    <g id={name} className={className}>
      {children}
    </g>
  );
}

SVGLayer.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.any,
};

export default SVGLayer;
