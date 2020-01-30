import React from 'react';
import PropTypes from 'prop-types';

import colorPropType from './colorPropType';
import ColorSlider from './ColorSlider';

const Saturation = ({ color, padding, innerSize, onChange, x, y }) => {
  const TYPE = 'SaturationSlider';
  const gradient = (
    <linearGradient id={`gradient_${TYPE}`} x1="1" x2="0" y1="0" y2="0">
      <stop
        offset="0%"
        stopColor={`hsl(${color.hsl[0]}, 100%, ${color.hsl[2]}%)`}
      />
      <stop
        offset="100%"
        stopColor={`hsl(${color.hsl[0]}, 0%, ${color.hsl[2]}%)`}
      />
    </linearGradient>
  );
  return (
    <ColorSlider
      index={1}
      type={TYPE}
      label="Saturation"
      gradient={gradient}
      color={color}
      padding={padding}
      innerSize={innerSize}
      onChange={onChange}
      x={x}
      y={y}
    />
  );
};

Saturation.propTypes = {
  color: colorPropType,
  x: PropTypes.number,
  y: PropTypes.number,
  padding: PropTypes.number,
  innerSize: PropTypes.number,
  onChange: PropTypes.func,
};

Saturation.defaultProps = {
  x: 0,
  y: 0,
  padding: 60,
  innerSize: 160,
};

export default Saturation;
