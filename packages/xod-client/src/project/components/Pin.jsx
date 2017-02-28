import React from 'react';
import classNames from 'classnames';
import { PIN_VALIDITY } from 'xod-core';
import { noop } from '../../utils/ramda';
import { PIN_RADIUS } from '../nodeLayout';

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

  isInjected() {
    return !!this.props.injected;
  }

  render() {
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
        <circle
          className="linkingHighlight"
          {...this.getCircleProps()}
          r="15"
        />
        {symbol}
      </g>
    );
  }
}

Pin.propTypes = {
  keyName: React.PropTypes.string.isRequired,
  injected: React.PropTypes.bool,
  type: React.PropTypes.string,
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
