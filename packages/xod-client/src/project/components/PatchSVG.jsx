import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import DraggedNodeShadowFilter from './filters/DraggedNodeShadowFilter';

const PatchSVG = ({
  children,
  isInPanningMode,
  isInResizingMode,
  isPanning,
  isInChangingArityLevelMode,
  svgRef,
  ...restProps
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={cn('PatchSVG', {
      isPanning,
      isInPanningMode,
      isInResizingMode,
      isInChangingArityLevelMode,
    })}
    width="100%"
    height="100%"
    ref={svgRef}
    {...restProps}
  >
    {/* Nested svg to compensate bluring of strokes */}
    <svg xmlns="http://www.w3.org/2000/svg" x="0.5" y="0.5">
      <defs>
        <DraggedNodeShadowFilter />
      </defs>
      {children}
    </svg>
  </svg>
);

PatchSVG.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]),
  isPanning: PropTypes.bool,
  isInPanningMode: PropTypes.bool,
  isInResizingMode: PropTypes.bool,
  isInChangingArityLevelMode: PropTypes.bool,
  onMouseDown: PropTypes.func,
  onMouseMove: PropTypes.func,
  onMouseUp: PropTypes.func,
  svgRef: PropTypes.func,
};

export default PatchSVG;
