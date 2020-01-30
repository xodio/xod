import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import colorPropType from './colorPropType';

import { BAR_SIZE, MARKER_RADIUS, TEXT_Y } from './style';

class ColorSlider extends React.Component {
  constructor(props) {
    super(props);

    const { width } = props;
    const padding = Math.round(width * 0.18);
    const innerSize = width - padding;

    this.padding = padding / 2;
    this.innerSize = innerSize;
    this.outterSize = innerSize + padding;

    this.state = {
      dragging: false,
    };

    // Reference to slider element
    this.slider = null;

    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.handleMove);
    document.addEventListener('mouseup', this.handleEnd);
  }
  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMove);
    document.removeEventListener('mouseup', this.handleEnd);
  }

  handleStart() {
    this.setState({ dragging: true });
  }
  handleMove(event) {
    if (this.state.dragging) {
      event.preventDefault();
      const value = this.props.color.hsl[this.props.index];
      const newValue = R.compose(p => parseInt(p, 10), R.max(0), R.min(100))(
        event.clientX / this.innerSize * 100
      );
      // Side effect: Commit new value
      R.unless(R.equals(value), this.props.onChange)(newValue);
    }
  }
  handleEnd() {
    this.setState({ dragging: false });
  }
  handleClick(event) {
    const xClick = event.clientX;
    const slider = this.slider.getBoundingClientRect();
    const percentage = (xClick - slider.x) / slider.width;
    const newValue = Math.round(percentage * 100);
    this.props.onChange(newValue);
  }
  handleReset() {
    this.props.onChange(this.props.default);
  }

  render() {
    const value = this.props.color.hsl[this.props.index];
    return (
      <svg x={this.props.x} y={this.props.y}>
        <g className={this.props.type}>
          <defs>{this.props.gradient}</defs>
          <g transform={`translate(${this.padding},${this.padding})`}>
            <rect
              ref={el => {
                this.slider = el;
              }}
              x={0}
              y={0}
              width={this.innerSize}
              height={BAR_SIZE}
              onClick={this.handleClick}
              fill={`url(#gradient_${this.props.type})`}
            />
            <circle
              cx={this.innerSize * (value / 100)}
              cy={0 + MARKER_RADIUS / 2}
              r={MARKER_RADIUS}
              fill={
                this.state.dragging
                  ? `hsl(${this.props.color.hsl[0]}, ${
                      this.props.color.hsl[1]
                    }%, ${this.props.color.hsl[2]}%)`
                  : 'white'
              }
              onMouseDown={this.handleStart}
              onDoubleClick={this.handleReset}
            />
            <text
              x={this.innerSize}
              y={TEXT_Y}
              textAnchor="end"
              className="ColorSlider_value"
            >
              {(value / 100).toFixed(3)}
            </text>
            <text
              className="ColorSlider_label"
              x={0}
              y={TEXT_Y}
              textAnchor="start"
            >
              {this.props.label}
            </text>
          </g>
        </g>
      </svg>
    );
  }
}

ColorSlider.propTypes = {
  color: colorPropType,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  index: PropTypes.number, // 0 — Hue, 1 — Saturation, 2 — Lightness
  gradient: PropTypes.element,
  type: PropTypes.string,
  label: PropTypes.string,
  default: PropTypes.number,
  onChange: PropTypes.func,
};

ColorSlider.defaultProps = {
  x: 0,
  y: 0,
  width: 220,
  default: 100,
};

export default ColorSlider;
