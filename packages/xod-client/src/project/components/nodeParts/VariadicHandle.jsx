import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import {
  NODE_CORNER_RADIUS,
  VARIADIC_HANDLE_WIDTH,
  VARIADIC_HANDLE_HEIGHT,
} from '../../nodeLayout';

const COMPENSATE_BLURING = 0.5;

/**
 * Outputs a string with coordinates for four points of variadic handle:
 *       0○
 *   3○
 *
 *   2○
 *       1○
 *
 * :: { width, height } -> String
 */
const getVariadicPoints = size => {
  const xRight = size.width - COMPENSATE_BLURING;
  const xLeft = size.width - VARIADIC_HANDLE_WIDTH - COMPENSATE_BLURING;
  const yTop = (size.height - VARIADIC_HANDLE_HEIGHT) / 2;
  const yBottom = yTop + VARIADIC_HANDLE_HEIGHT;

  const points = [
    [xRight, yTop], // 0
    [xRight, yBottom], // 1
    [xLeft, yBottom - VARIADIC_HANDLE_WIDTH], // 2
    [xLeft, yTop + VARIADIC_HANDLE_WIDTH], // 3
  ];

  return R.compose(R.join(' '), R.unnest)(points);
};

const VariadicHandle = props => (
  <g className="VariadicHandle">
    <rect
      className="VariadicHandle--clickArea"
      rx={NODE_CORNER_RADIUS}
      ry={NODE_CORNER_RADIUS}
      x={props.size.width - VARIADIC_HANDLE_WIDTH * 2}
      y={-1}
      width={VARIADIC_HANDLE_WIDTH * 2 + 2}
      height={props.size.height + 1}
      fill="rgba(255,0,0,.5)"
      onMouseDown={props.onMouseDown}
    />
    <polygon
      className="VariadicHandle--grip"
      points={getVariadicPoints(props.size)}
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
