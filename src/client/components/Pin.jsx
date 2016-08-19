
import React from 'react';
import classNames from 'classnames';
import * as PIN_DIRECTION from '../constants/pinDirection';
import * as PIN_VALIDITY from '../constants/pinValidity';


export default class Pin extends React.Component {
  constructor(props) {
    super(props);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  onMouseUp() {
    this.props.onMouseUp(this.props.keyName);
  }

  getPosition() {
    const radius = this.props.radius;
    return {
      x: this.props.position.x + radius + 1,
      y: this.props.position.y + radius + 1,
    };
  }

  getHotspotProps() {
    const halfSide = this.props.radius + 1;
    return {
      x: this.getPosition().x - halfSide,
      y: this.getPosition().y - halfSide,
      width: halfSide * 2,
      height: halfSide * 2,
      fill: 'transparent',
    };
  }

  getCircleProps() {
    return {
      cx: this.getPosition().x,
      cy: this.getPosition().y,
      r: this.props.radius,
    };
  }

  getTextProps() {
    const textMargin = this.props.radius * (this.isInput() ? 1 : -1);
    const pos = this.getPosition();
    return {
      x: pos.x + textMargin,
      y: pos.y,
      transform: `rotate(-90 ${pos.x}, ${pos.y})`,
      textAnchor: this.isInput() ? 'start' : 'end',
    };
  }

  getDirection() {
    return this.props.direction;
  }

  isInput() {
    return (this.getDirection() === PIN_DIRECTION.INPUT);
  }

  isOutput() {
    return (this.getDirection() === PIN_DIRECTION.OUTPUT);
  }

  render() {
    const label = this.props.label ? (
      <text
        className="label"
        key={`pinText_${this.props.keyName}`}
        {...this.getTextProps()}
      >
        {this.props.label}
      </text>
    ) : null;

    const cls = classNames('Pin', {
      'is-selected': this.props.isSelected,
      'is-valid': this.props.validness === PIN_VALIDITY.VALID,
      'is-almost-valid': this.props.validness === PIN_VALIDITY.ALMOST,
    });

    return (
      <g
        className={cls}
        id={this.props.keyName}
        onMouseUp={this.onMouseUp}
        onMouseOver={this.handleOver}
        onMouseOut={this.handleOut}
      >
        <rect {...this.getHotspotProps()} />
        <circle className="symbol" {...this.getCircleProps()} />
        {label}
      </g>
    );
  }
}

Pin.propTypes = {
  nodeId: React.PropTypes.number.isRequired,
  keyName: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  direction: React.PropTypes.string.isRequired,
  position: React.PropTypes.object.isRequired,
  radius: React.PropTypes.number.isRequired,
  onMouseUp: React.PropTypes.func.isRequired,
  isSelected: React.PropTypes.bool,
  validness: React.PropTypes.number,
};

Pin.defaultProps = {
  validness: PIN_VALIDITY.NONE,
};
