import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import convert from 'color-convert';
import { debounce } from 'throttle-debounce';

import colorPropType from './colorPropType';
import Hue from './Hue';
import SatLightBox from './SatLightBox';

const getNewColor = newHsl => ({
  hsl: newHsl,
  hex: `#${convert.hsl.hex(newHsl)}`,
});

const getStateColors = color => ({
  color,
  hue: (color.hsl[0] / 360).toFixed(3),
  saturation: (color.hsl[1] / 100).toFixed(3),
  lightness: (color.hsl[2] / 100).toFixed(3),
});

const normalizeInputValue = R.unless(
  R.test(/^0*((\.[0-9]*)?|1)$/),
  R.always(0)
);

class ColorPicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = getStateColors(props.color);

    // Basic handlers
    this.onChange = debounce(10, this.onChange.bind(this));
    this.onHuePickerChange = this.onHuePickerChange.bind(this);
    this.onSaturationLightnessChange = this.onSaturationLightnessChange.bind(
      this
    );
    // Input
    this.onHueInputChange = this.onHueInputChange.bind(this);
    this.onSaturationInputChange = this.onSaturationInputChange.bind(this);
    this.onLightnessInputChange = this.onLightnessInputChange.bind(this);
    // Commit input changes
    this.onInputKeyDown = this.onInputKeyDown.bind(this);
    this.commitInputs = this.commitInputs.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (!R.equals(this.state.color, nextProps.color)) {
      this.setState(getStateColors(nextProps.color));
    }
  }

  onChange(newHsl) {
    this.props.onChange(getNewColor(newHsl));
  }
  onSaturationLightnessChange(saturation, lightness) {
    this.onChange([this.state.color.hsl[0], saturation, lightness]);
  }
  onHuePickerChange(degree) {
    this.onChange([degree, this.state.color.hsl[1], this.state.color.hsl[2]]);
  }
  onHueInputChange(event) {
    this.setState({ hue: normalizeInputValue(event.target.value) });
  }
  onSaturationInputChange(event) {
    this.setState({ saturation: normalizeInputValue(event.target.value) });
  }
  onLightnessInputChange(event) {
    this.setState({ lightness: normalizeInputValue(event.target.value) });
  }
  onInputKeyDown(event) {
    if (event.keyCode === 13) {
      this.commitInputs();
    }
  }
  commitInputs() {
    this.onChange([
      this.state.hue * 360,
      this.state.saturation * 100,
      this.state.lightness * 100,
    ]);
  }

  render() {
    const { color, hue, saturation, lightness } = this.state;
    return (
      <div className="ColorPicker">
        <SatLightBox
          width={110}
          height={70}
          color={color}
          onChange={this.onSaturationLightnessChange}
        />
        <svg
          width={220}
          height={220}
          viewBox={`0 0 220 220`}
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
        >
          <Hue
            color={color}
            onChange={this.onHuePickerChange}
            default={0}
            width={220}
          />
        </svg>
        <div
          className="ColorPicker_preview"
          style={{
            background: `hsl(${color.hsl[0]}, ${color.hsl[1]}%, ${
              color.hsl[2]
            }%)`,
          }}
        />
        <div className="ColorPicker_values">
          <div>
            <label htmlFor="ColorPicker_Hue">Hue:</label>
            <input
              id="ColorPicker_Hue"
              value={hue}
              onChange={this.onHueInputChange}
              onBlur={this.commitInputs}
              onKeyDown={this.onInputKeyDown}
            />
          </div>
          <div>
            <label htmlFor="ColorPicker_Saturation">Saturation:</label>
            <input
              id="ColorPicker_Saturation"
              value={saturation}
              onChange={this.onSaturationInputChange}
              onBlur={this.commitInputs}
              onKeyDown={this.onInputKeyDown}
            />
          </div>
          <div>
            <label htmlFor="ColorPicker_Lightness">Lightness:</label>
            <input
              id="ColorPicker_Lightness"
              value={lightness}
              onChange={this.onLightnessInputChange}
              onBlur={this.commitInputs}
              onKeyDown={this.onInputKeyDown}
            />
          </div>
        </div>
      </div>
    );
  }
}

ColorPicker.propTypes = {
  color: colorPropType,
  onChange: PropTypes.func,
};

export default ColorPicker;

export const hex2color = hex => ({
  hsl: convert.hex.hsl(hex),
  hex,
});
