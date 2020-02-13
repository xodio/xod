import React from 'react';
import PropTypes from 'prop-types';

import colorPropType from './colorPropType';

const THICKNESS = 20;

const preventDefaultOnly = event => event.preventDefault();

class HueCircle extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dragging: false,
      xMouseDelta: 0,
      yMouseDelta: 0,
    };

    this.circleRef = null;

    this.handleStart = this.handleStart.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.handleMove);
    document.addEventListener('mouseup', this.handleEnd);
    document.addEventListener('dragstart', preventDefaultOnly);
  }
  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMove);
    document.removeEventListener('mouseup', this.handleEnd);
    document.removeEventListener('dragstart', preventDefaultOnly);
  }

  handleStart(event, degree = this.props.color.hsl[0]) {
    const { radius } = this.props;
    const xMouseShouldBe = Math.sin(degree / 180 * Math.PI) * radius;
    const yMouseShouldBe = -Math.cos(degree / 180 * Math.PI) * radius;

    this.setState({
      dragging: true,
      xMouseDelta: event.clientX - xMouseShouldBe,
      yMouseDelta: event.clientY - yMouseShouldBe,
    });
  }
  handleClick(event) {
    if (!this.circleRef) return;

    const bbox = this.circleRef.getBoundingClientRect();
    const xCenter = bbox.left + bbox.width / 2;
    const yCenter = bbox.top + bbox.height / 2;
    const xRelativeToCenter = event.clientX - xCenter;
    const yRelativeToCenter = event.clientY - yCenter;
    const degree =
      Math.atan(yRelativeToCenter / xRelativeToCenter) * 180 / Math.PI +
      90 +
      (xRelativeToCenter >= 0 ? 0 : 180);
    const hue = parseInt(degree, 10);
    if (this.props.color.hsl[0] !== hue) {
      this.props.onChange(hue);
    }
    this.handleStart(event, degree);
  }
  handleMove(event, clicked = false) {
    if (this.state.dragging || clicked) {
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

  render() {
    const { radius } = this.props;
    const degree = this.props.color.hsl[0];
    const circleStyle = {
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
    };
    const innerCircleRadius = (radius - THICKNESS) * 2;
    const innerCircleStyle = {
      width: `${innerCircleRadius}px`,
      height: `${innerCircleRadius}px`,
      marginLeft: `-${innerCircleRadius / 2}px`,
      marginTop: `-${innerCircleRadius / 2}px`,
    };
    const pointerX =
      Math.sin(degree / 180 * Math.PI) * (radius - THICKNESS / 2);
    const pointerY =
      -Math.cos(degree / 180 * Math.PI) * (radius - THICKNESS / 2);
    const pointerRadius = THICKNESS / 2 - THICKNESS / 4;
    const pointerStyle = {
      width: `${pointerRadius * 2}px`,
      height: `${pointerRadius * 2}px`,
      marginLeft: `-${pointerRadius}px`,
      marginTop: `-${pointerRadius}px`,
      transform: `translate(${pointerX}px, ${pointerY}px)`,
    };
    return (
      <div className="HueCircle" style={circleStyle}>
        <div
          className="HueCircle_area"
          ref={el => {
            this.circleRef = el;
          }}
          style={circleStyle}
          onMouseDown={this.handleClick}
        />
        <div className="HueCircle_inner" style={innerCircleStyle} />
        <div
          className="HueCircle_pointer"
          style={pointerStyle}
          onMouseDown={this.handleStart}
          onDoubleClick={this.handleReset}
        />
      </div>
    );
  }
}

HueCircle.propTypes = {
  color: colorPropType,
  radius: PropTypes.number,
  default: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

HueCircle.defaultProps = {
  radius: 90,
  default: 0,
};

export default HueCircle;
