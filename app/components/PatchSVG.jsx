import React from 'react';

const PatchSVG = ({ children, onMouseMove, onMouseUp }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="PatchSVG"
    width="100%"
    height="100%"
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
  >
    {children}
  </svg>
);

PatchSVG.propTypes = {
  children: React.PropTypes.arrayOf(React.PropTypes.element),
  onMouseMove: React.PropTypes.func,
  onMouseUp: React.PropTypes.func,
};

export default PatchSVG;
