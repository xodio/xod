import React from 'react';

function SVGLayer({ name, children }) {
  return (
    <g id={name}>
      {children}
    </g>
  );
}

SVGLayer.propTypes = {
  name: React.PropTypes.string.isRequired,
  children: React.PropTypes.any.isRequired,
};

export default SVGLayer;
