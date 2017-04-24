import React from 'react';
import classNames from 'classnames';
import { PIN_RADIUS, PIN_HIGHLIGHT_RADIUS } from '../nodeLayout';

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

  render() {
    const cls = classNames('Pin', {
      'is-selected': this.props.isSelected,
      'is-accepting-links': this.props.isAcceptingLinks,
    });

    const symbolClassNames = classNames(
      'symbol', this.props.type,
      { 'is-connected': this.props.isConnected }
    );

    const pinCircleCenter = {
      cx: this.getPinCenter().x,
      cy: this.getPinCenter().y,
    };

    return (
      <g
        className={cls}
        id={this.props.keyName}
        onMouseUp={this.onMouseUp}
        onMouseDown={this.onMouseDown}
        onMouseOver={this.handleOver}
        onMouseOut={this.handleOut}
      >
        <rect {...this.getHotspotProps()} />
        <circle
          className="linkingHighlight"
          {...pinCircleCenter}
          r={PIN_HIGHLIGHT_RADIUS}
        />
        <circle
          className={symbolClassNames}
          {...pinCircleCenter}
          r={PIN_RADIUS}
        />
      </g>
    );
  }
}

Pin.propTypes = {
  keyName: React.PropTypes.string.isRequired,
  type: React.PropTypes.string,
  position: React.PropTypes.object.isRequired,
  onMouseUp: React.PropTypes.func.isRequired,
  onMouseDown: React.PropTypes.func.isRequired,
  isSelected: React.PropTypes.bool,
  isConnected: React.PropTypes.bool,
  isAcceptingLinks: React.PropTypes.bool,
};
