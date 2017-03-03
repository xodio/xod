import React from 'react';

function SVGLayer({ name, className, children }) {
  return (
    <g id={name} className={className}>
      {children}
    </g>
  );
}

SVGLayer.propTypes = {
  name: React.PropTypes.string.isRequired,
  className: React.PropTypes.string,
  children: React.PropTypes.any,
};

export default SVGLayer;
