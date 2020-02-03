import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import convert from 'color-convert';

import colorPropType from './colorPropType';

import Hue from './Hue';
import Saturation from './Saturation';
import Lightness from './Lightness';

const ColorPicker = ({ color, onChange }) => {
  const updateColor = newHsl =>
    onChange({
      hsl: newHsl,
      hex: `#${convert.hsl.hex(newHsl)}`,
    });
  const setHue = hueDegree =>
    updateColor([hueDegree, color.hsl[1], color.hsl[2]]);
  const setSaturation = saturation =>
    updateColor([color.hsl[0], saturation, color.hsl[2]]);
  const setLightness = lightness =>
    updateColor([color.hsl[0], color.hsl[1], lightness]);

  return (
    <div className="ColorPicker">
      <svg
        width={220}
        height={330}
        viewBox={`0 0 220 330`}
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
      >
        <Hue color={color} onChange={setHue} default={0} width={220} />
        <Saturation
          color={color}
          onChange={setSaturation}
          default={100}
          y={210}
        />
        <Lightness color={color} onChange={setLightness} default={50} y={260} />
      </svg>
    </div>
  );
};

ColorPicker.propTypes = {
  color: colorPropType,
  onChange: PropTypes.func,
};

export default ColorPicker;

export const hex2color = hex => ({
  hsl: convert.hex.hsl(hex),
  hex,
});
