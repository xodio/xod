import React from 'react';
import PropTypes from 'prop-types';

import colorPropType from './colorPropType';
import HueSlice from './HueSlice';

import { BAR_SIZE } from './style';

class Hue extends React.Component {
  constructor(props) {
    super(props);

    const { width } = props;
    const padding = Math.round(width * 0.25);
    const innerSize = width - padding;
    this.radius = innerSize / 2;
    this.outterSize = width;
    this.centerOffset = this.outterSize / 2;
    this.previewSize = Math.round(this.radius - BAR_SIZE * 3.5);

    this.state = {
      dragging: false,
      xMouseDelta: 0,
      yMouseDelta: 0,
    };

    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
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

  handleStart(event, deg = this.props.color.hsl[0]) {
    const xMouseShouldBe = Math.sin(deg / 180 * Math.PI) * this.radius;
    const yMouseShouldBe = -Math.cos(deg / 180 * Math.PI) * this.radius;

    this.setState({
      dragging: true,
      xMouseDelta: event.clientX - xMouseShouldBe,
      yMouseDelta: event.clientY - yMouseShouldBe,
    });
  }
  handleMove(event) {
    if (this.state.dragging) {
      event.preventDefault();
      const xRelativeToCenter = event.clientX - this.state.xMouseDelta;
      const yRelativeToCenter = event.clientY - this.state.yMouseDelta;
      const degree =
        Math.atan(yRelativeToCenter / xRelativeToCenter) * 180 / Math.PI +
        90 +
        (xRelativeToCenter >= 0 ? 0 : 180);
      const hue = parseInt(degree, 10);
      if (this.props.color.hsl[0] !== hue) {
        this.props.onChange(hue);
      }
    }
  }
  handleEnd() {
    this.setState({ dragging: false });
  }
  handleReset() {
    this.props.onChange(this.props.default);
  }

  renderValues() {
    if (!this.props.withValues) return null;
    return [
      <text
        className="HueSlider_value"
        x={this.radius + BAR_SIZE / 2}
        y={this.radius + BAR_SIZE / 2}
        textAnchor="end"
      >
        {(this.props.color.hsl[0] / 360).toFixed(3)}
      </text>,
      <text
        className="HueSlider_label"
        x={-this.radius - BAR_SIZE / 2}
        y={this.radius + BAR_SIZE / 2}
        textAnchor="start"
      >
        Hue
      </text>,
    ];
  }

  renderPreview() {
    if (!this.props.withPreview) return null;
    return (
      <circle
        cx={0}
        cy={0}
        r={this.previewSize}
        fill={`hsl(${this.props.color.hsl[0]}, ${this.props.color.hsl[1]}%, ${
          this.props.color.hsl[2]
        }%)`}
      />
    );
  }
  render() {
    return (
      <svg x={this.props.x} y={this.props.y}>
        <g
          className="HueSlider"
          transform={`translate(${this.centerOffset},${this.centerOffset})`}
        >
          {this.renderPreview()}
          <g className="colorCircle">
            {Array.from({ length: 360 }, (_, deg) => (
              <HueSlice
                key={deg}
                degree={deg}
                radius={this.radius}
                color={`hsl(${deg}, ${this.props.color.hsl[1]}%, ${
                  this.props.color.hsl[2]
                }%)`}
                marker={false}
                onMouseDown={event => {
                  this.props.onChange(deg);
                  this.handleStart(event, deg);
                }}
              />
            ))}
          </g>
          <HueSlice
            degree={this.props.color.hsl[0]}
            radius={this.radius}
            color={
              this.state.dragging
                ? `hsl(${this.props.color.hsl[0]}, ${
                    this.props.color.hsl[1]
                  }%, ${this.props.color.hsl[2]}%)`
                : 'white'
            }
            marker
            onMouseDown={this.handleStart}
            onDoubleClick={this.handleReset}
          />
          {this.renderValues()}
        </g>
      </svg>
    );
  }
}

Hue.propTypes = {
  color: colorPropType,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  default: PropTypes.number,
  withPreview: PropTypes.bool,
  withValues: PropTypes.bool,
  onChange: PropTypes.func,
};

Hue.defaultProps = {
  x: 0,
  y: 0,
  width: 220,
  default: 0,
  withPreview: false,
  withPreview: false,
};

export default Hue;
