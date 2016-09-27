import React from 'react';
import classNames from 'classnames';
import { PIN_DIRECTION, PIN_VALIDITY } from 'xod-core/project/constants';
import { noop } from 'xod-client/utils/ramda';

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

  getTriangleProps() {
    const r = this.props.radius;
    const x = this.getPosition().x - r;
    const y = this.getPosition().y - r;
    const s = r * 2;

    return {
      points: [
        `${x},${y}`,
        `${x + s},${y}`,
        `${x + s / 2},${y + s}`,
      ].join(' '),
    };
  }

  getTextProps() {
    const textMargin = this.props.radius * (this.isInput() ? 1 : -1);
    const pos = this.getPosition();
    return {
      x: pos.x + textMargin + 2,
      y: pos.y + 4,
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

  isInjected() {
    return !!this.props.injected;
  }

  render() {
    const pinLabel = this.props.pinLabel ? (
      <text
        className="pinLabel"
        key={`pinText_${this.props.keyName}`}
        {...this.getTextProps()}
      >
        {this.props.pinLabel}
      </text>
    ) : null;

    const cls = classNames('Pin', {
      'is-property': this.isInjected(),
      'is-selected': this.props.isSelected,
      'is-valid': this.props.validness === PIN_VALIDITY.VALID,
      'is-almost-valid': this.props.validness === PIN_VALIDITY.ALMOST,
    });

    const onMouseOver = !this.isInjected() ? this.handleOver : noop;
    const onMouseOut = !this.isInjected() ? this.handleOut : noop;

    const symbol = !this.isInjected() ?
      <circle className="symbol" {...this.getCircleProps()} /> :
      <polygon className="symbol" {...this.getTriangleProps()} />;

    return (
      <g
        className={cls}
        id={this.props.keyName}
        onMouseUp={this.onMouseUp}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
      >
        <rect {...this.getHotspotProps()} />
        {symbol}
        {pinLabel}
      </g>
    );
  }
}

Pin.propTypes = {
  nodeId: React.PropTypes.number.isRequired,
  keyName: React.PropTypes.string.isRequired,
  injected: React.PropTypes.bool,
  pinLabel: React.PropTypes.string,
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
