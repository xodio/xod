import React from 'react';
import PropTypes from 'prop-types';
import { noop } from 'xod-func-tools';

import { SLOT_SIZE, NODE_HEIGHT } from '../../nodeLayout';

// Add 0.5 to compensate blurring of pattern
const COMPENSATE_BLUR = 0.5;

const NodeSlotPattern = ({ offset }) => (
  <pattern
    id="patch_bg_pattern"
    x={Math.round(offset.x) - COMPENSATE_BLUR}
    y={Math.round(offset.y) - COMPENSATE_BLUR}
    width={SLOT_SIZE.WIDTH}
    height={SLOT_SIZE.HEIGHT}
    patternUnits="userSpaceOnUse"
  >
    <g stroke="none" fill="none">
      <line x1={COMPENSATE_BLUR} y1={1} x2={COMPENSATE_BLUR} y2={NODE_HEIGHT} />
      <line
        x1={0}
        y1={COMPENSATE_BLUR}
        x2={SLOT_SIZE.WIDTH}
        y2={COMPENSATE_BLUR}
      />
      <line
        x1={0}
        y1={NODE_HEIGHT + COMPENSATE_BLUR}
        x2={SLOT_SIZE.WIDTH}
        y2={NODE_HEIGHT + COMPENSATE_BLUR}
      />
    </g>
  </pattern>
);

NodeSlotPattern.propTypes = {
  offset: PropTypes.object.isRequired,
};

const BackgroundLayer = ({ onClick, onDoubleClick, onMouseDown, offset }) => (
  <g className="BackgroundLayer">
    <NodeSlotPattern offset={offset} />
    <rect
      className="BackgroundRect"
      key="bg"
      x="0"
      y="0"
      width="100%"
      height="100%"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
    />
  </g>
);

BackgroundLayer.defaultProps = {
  onClick: noop,
  onDoubleClick: noop,
  onMouseDown: noop,
};

BackgroundLayer.propTypes = {
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  offset: PropTypes.object.isRequired,
};

export default BackgroundLayer;
