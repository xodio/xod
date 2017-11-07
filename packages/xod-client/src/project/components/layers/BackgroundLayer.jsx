import React from 'react';
import PropTypes from 'prop-types';
import { noop } from 'xod-func-tools';

import { SLOT_SIZE, NODE_HEIGHT } from '../../nodeLayout';

const NodeSlotPattern = ({ offset }) => (
  <pattern
    id="patch_bg_pattern"
    x={offset.x}
    y={offset.y}
    width={SLOT_SIZE.WIDTH}
    height={SLOT_SIZE.HEIGHT}
    patternUnits="userSpaceOnUse"
  >
    <g stroke="none" fill="none">
      <line x1={1} y1={1} x2={1} y2={NODE_HEIGHT} />
      <line x1={0} y1={1} x2={SLOT_SIZE.WIDTH} y2={1} />
      <line x1={0} y1={NODE_HEIGHT} x2={SLOT_SIZE.WIDTH} y2={NODE_HEIGHT} />
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
