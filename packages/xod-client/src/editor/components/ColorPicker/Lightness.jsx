import React from 'react';
import PropTypes from 'prop-types';

import colorPropType from './colorPropType';
import ColorSlider from './ColorSlider';

const Lightness = ({ color, padding, innerSize, onChange, x, y }) => {
  const TYPE = 'LightnessSlider';
  const gradient = (
    <linearGradient id={`gradient_${TYPE}`} x1="1" x2="0" y1="0" y2="0">
      <stop
        offset="0%"
        stopColor={`hsl(${color.hsl[0]}, ${color.hsl[1]}%, 100%)`}
      />
      <stop
        offset="50%"
        stopColor={`hsl(${color.hsl[0]}, ${color.hsl[1]}%, 50%)`}
      />
      <stop
        offset="100%"
        stopColor={`hsl(${color.hsl[0]}, ${color.hsl[1]}%, 0%)`}
      />
    </linearGradient>
  );
  return (
    <ColorSlider
      index={2}
      type={TYPE}
      label="Lightness"
      gradient={gradient}
      color={color}
      padding={padding}
      innerSize={innerSize}
      onChange={onChange}
      default={50}
      x={x}
      y={y}
    />
  );
};

Lightness.propTypes = {
  color: colorPropType,
  x: PropTypes.number,
  y: PropTypes.number,
  padding: PropTypes.number,
  innerSize: PropTypes.number,
  onChange: PropTypes.func,
};

Lightness.defaultProps = {
  x: 0,
  y: 0,
  padding: 60,
  innerSize: 160,
};

export default Lightness;
