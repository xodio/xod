import React from 'react';

// because React can't properly render some of these attributes
/* eslint-disable react/no-danger */
const filtersHTML = {
  __html: `<filter id="dropshadow" width="150%" height="150%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
            <feOffset dx="1" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>`,
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
