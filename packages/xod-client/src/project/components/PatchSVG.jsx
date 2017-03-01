import React from 'react';

const shadowFilter = (id, dx, dy, deviation, slope = 0.5) =>
  `<filter id="${id}" width="150%" height="150%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="${deviation}" />
    <feOffset dx="${dx}" dy="${dy}" result="offsetblur" />
    <feComponentTransfer>
      <feFuncA type="linear" slope="${slope}" />
    </feComponentTransfer>
    <feMerge>
      <feMergeNode />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>`;

// because React can't properly render some of these attributes
/* eslint-disable react/no-danger */
const filtersHTML = {
  __html: [
    shadowFilter('pinShadow', 1, 1, 1),
    shadowFilter('draggedNodeShadow', 0, 1, 4, 0.85),
  ].join(''),
};

const PatchSVG = ({ children, onMouseMove, onMouseUp }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="PatchSVG"
    width="100%"
    height="100%"
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
  >
    <defs dangerouslySetInnerHTML={filtersHTML} />
    {children}
  </svg>
);

PatchSVG.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.element,
    React.PropTypes.arrayOf(React.PropTypes.element),
  ]),
  onMouseMove: React.PropTypes.func,
  onMouseUp: React.PropTypes.func,
};

export default PatchSVG;
