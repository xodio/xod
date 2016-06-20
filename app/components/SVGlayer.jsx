import React from 'react';

const SVGLayer = ({name, childs}) => {

  return (
    <g id={name}>
      {childs}
    </g>
  );
};

export default SVGLayer;