import React from 'react';
import PropTypes from 'prop-types';

import { BAR_SIZE, MARKER_SIZE } from './style';

const HueSlice = ({
  degree,
  color,
  radius,
  marker,
  onMouseDown,
  onClick,
  onDoubleClick,
}) => {
  const thickness = marker ? 0 : 1;
  const startX = Math.sin((degree - thickness) / 180 * Math.PI) * radius;
  const startY = -Math.cos((degree - thickness) / 180 * Math.PI) * radius;
  const endX = Math.sin((degree + thickness) / 180 * Math.PI) * radius;
  const endY = -Math.cos((degree + thickness) / 180 * Math.PI) * radius;
  return (
    <path
      className={marker ? 'marker' : ''}
      d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
      stroke={color}
      strokeWidth={marker ? MARKER_SIZE : BAR_SIZE}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    />
  );
};

HueSlice.propTypes = {
  degree: PropTypes.number,
  radius: PropTypes.number,
  color: PropTypes.string,
  marker: PropTypes.bool,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onMouseDown: PropTypes.func,
};

HueSlice.defaultProps = {
  thickness: 1,
  onClick: () => {},
  onMouseDown: () => {},
};

export default HueSlice;
