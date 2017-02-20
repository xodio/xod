import React from 'react';
import classNames from 'classnames';
import { PIN_DIRECTION, PIN_VALIDITY } from 'xod-core';
import { noop } from '../../utils/ramda';

const PIN_RADIUS = 6;
const TEXT_OFFSET_FROM_PIN_BORDER = 10;

export default class Pin extends React.Component {
  constructor(props) {
    super(props);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  onMouseUp() {
    this.props.onMouseUp(this.props.keyName);
  }

  onMouseDown() {
    this.props.onMouseDown(this.props.keyName);
  }

  getPinCenter() {
    return this.props.position;
  }

  getHotspotProps() {
    const halfSide = PIN_RADIUS + 1;
    return {
      x: this.getPinCenter().x - halfSide,
      y: this.getPinCenter().y - halfSide,
      width: halfSide * 2,
      height: halfSide * 2,
      fill: 'transparent',
    };
  }

  getCircleProps() {
    return {
      cx: this.getPinCenter().x,
      cy: this.getPinCenter().y,
      r: PIN_RADIUS,
    };
  }

  getRectProps() {
    const x = this.getPinCenter().x - PIN_RADIUS;
    const y = this.getPinCenter().y - PIN_RADIUS;
    const side = PIN_RADIUS * 2;

    return {
      x,
      y,
      width: side,
      height: side,
    };
  }

  getTextProps() {
    const textVerticalOffset = PIN_RADIUS + TEXT_OFFSET_FROM_PIN_BORDER;
    const pos = this.getPinCenter();
    return {
      x: pos.x,
      y: pos.y + (textVerticalOffset * (this.isInput() ? 1 : -1)),
      textAnchor: 'middle',
    };
  }

  getDirection() {
    return this.props.direction;
  }

  isInput() {
    return (this.getDirection() === PIN_DIRECTION.INPUT);
  }

  isInjected() {
    return !!this.props.injected;
  }

  render() {
    const pinLabel = this.props.pinLabel ? (
      <text
        className={`label ${this.isInput() ? 'input' : 'output'}`}
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

    const symbolClassNames = classNames(
      'symbol', this.props.type,
      { 'is-connected': this.props.isConnected }
    );

    const symbol = !this.isInjected() ?
      <circle className={symbolClassNames} {...this.getCircleProps()} /> :
      <rect className={symbolClassNames} {...this.getRectProps()} />;

    return (
      <g
        className={cls}
        id={this.props.keyName}
        onMouseUp={this.onMouseUp}
        onMouseDown={this.onMouseDown}
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
  keyName: React.PropTypes.string.isRequired,
  injected: React.PropTypes.bool,
  pinLabel: React.PropTypes.string,
  type: React.PropTypes.string,
  direction: React.PropTypes.string.isRequired,
  position: React.PropTypes.object.isRequired,
  onMouseUp: React.PropTypes.func.isRequired,
  onMouseDown: React.PropTypes.func.isRequired,
  isSelected: React.PropTypes.bool,
  isConnected: React.PropTypes.bool,
  validness: React.PropTypes.number,
};

Pin.defaultProps = {
  validness: PIN_VALIDITY.NONE,
};
