import React from 'react';
import PropTypes from 'prop-types';

import { NODE_CORNER_RADIUS } from '../../nodeLayout';

const VariadicHandle = props => (
  <g className="VariadicHandle">
    <rect
      className="VariadicHandle--clickArea"
      rx={NODE_CORNER_RADIUS}
      ry={NODE_CORNER_RADIUS}
      x={props.size.width - 8}
      y={-1}
      width={10}
      height={props.size.height + 2}
      fill="rgba(255,0,0,.5)"
      onMouseDown={props.onMouseDown}
    />
    <line
      className="VariadicHandle--grip"
      x1={props.size.width - 1.5}
      x2={props.size.width - 1.5}
      y1={(props.size.height / 2) - 5}
      y2={(props.size.height / 2) + 5}
    />
  </g>
);

VariadicHandle.propTypes = {
  size: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }).isRequired,
  onMouseDown: PropTypes.func.isRequired,
};

export default VariadicHandle;
