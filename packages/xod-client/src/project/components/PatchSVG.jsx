import React from 'react';
import PropTypes from 'prop-types';

import PinShadowFilter from './filters/PinShadowFilter';
import DraggedNodeShadowFilter from './filters/DraggedNodeShadowFilter';

const PatchSVG = ({ children, onMouseMove, onMouseUp }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="PatchSVG"
    width="100%"
    height="100%"
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
  >
    <defs>
      <PinShadowFilter />
      <DraggedNodeShadowFilter />
    </defs>
    {children}
  </svg>
);

PatchSVG.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]),
  onMouseMove: PropTypes.func,
  onMouseUp: PropTypes.func,
};

export default PatchSVG;
