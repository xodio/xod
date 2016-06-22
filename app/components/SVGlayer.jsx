import React from 'react';

function SVGLayer({ name, childs }) {
  return (
    <g id={name}>
      {childs}
    </g>
  );
}

export default SVGLayer;