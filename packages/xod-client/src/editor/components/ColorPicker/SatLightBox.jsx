import React from 'react';
import PropTypes from 'prop-types';
import convert from 'color-convert';

import colorPropType from './colorPropType';

const inRange = (min, max, val) => Math.max(Math.min(max, val), min);

const calculateNewHSL = (event, hue, containerEl) => {
  const containerBbox = containerEl.getBoundingClientRect();
  const {
    width: cWidth,
    height: cHeight,
    left: cLeft,
    top: cTop,
  } = containerBbox;

  const x = event.clientX;
  const y = event.clientY;
  const leftPos = x - (cLeft + window.pageXOffset);
  const topPos = y - (cTop + window.pageYOffset);

  const saturation = inRange(0, cWidth, leftPos) / cWidth * 100;
  const brightness = (1 - inRange(0, cHeight, topPos) / cHeight) * 100;
  return convert.hsv.hsl([hue, saturation, brightness]);
};

const preventDefaultOnly = event => event.preventDefault();

class SatLightBox extends React.Component {
  constructor(props) {
    super(props);

    this.containerRef = null;

    this.state = { dragging: false };

    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.unbindHandlers = this.unbindHandlers.bind(this);
  }
  unbindHandlers() {
    document.addEventListener('mousemove', this.handleMove);
    document.addEventListener('mouseup', this.handleEnd);
    document.addEventListener('dragstart', preventDefaultOnly);
  }

  handleStart() {
    this.setState({ dragging: true });
    document.addEventListener('mousemove', this.handleMove);
    document.addEventListener('mouseup', this.handleEnd);
    document.removeEventListener('dragstart', preventDefaultOnly);
  }

  handleMove(event) {
    if (this.state.dragging && this.containerRef) {
      event.preventDefault();
      const newHsl = calculateNewHSL(
        event,
        this.props.color.hsl[0],
        this.containerRef
      );
      this.props.onChange(newHsl[1], newHsl[2]);
    }
  }
  handleClick(event) {
    if (this.containerRef) {
      const newHsl = calculateNewHSL(
        event,
        this.props.color.hsl[0],
        this.containerRef
      );
      this.props.onChange(newHsl[1], newHsl[2]);
    }
  }
  handleEnd() {
    this.setState({ dragging: false });
    this.unbindHandlers();
  }

  render() {
    const pureColor = `#${convert.hsl.hex([this.props.color.hsl[0], 100, 50])}`;
    const hsv = convert.hsl.hsv(this.props.color.hsl);
    const pointerStyle = {
      left: `${hsv[1]}%`, // saturation
      top: `${100 - hsv[2]}%`, // brightness
      cursor: this.state.dragging ? 'dragging' : 'drag',
    };
    /* eslint-disable jsx-a11y/no-static-element-interactions */
    return (
      <div
        className="SatLightBox"
        style={{
          backgroundColor: pureColor,
          width: this.props.width,
          height: this.props.height,
        }}
        ref={el => {
          this.containerRef = el;
        }}
      >
        <div
          className="SatLightBox_container"
          onMouseDown={this.handleStart}
          onClick={this.handleClick}
        >
          <div className="SatLightBox_pointer" style={pointerStyle} />
        </div>
        <div className="SatLightBox_gradients" />
      </div>
    );
    /* eslint-enable jsx-a11y/no-static-element-interactions */
  }
}

SatLightBox.propTypes = {
  color: colorPropType,
  width: PropTypes.number,
  height: PropTypes.number,
  onChange: PropTypes.func,
};

SatLightBox.defaultProps = {
  x: 0,
  y: 0,
  width: 220,
  height: 160,
};

export default SatLightBox;
