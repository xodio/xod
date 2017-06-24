import React from 'react';
import classNames from 'classnames';
import { PIN_RADIUS, PIN_HIGHLIGHT_RADIUS } from '../nodeLayout';

export default class PinOverlay extends React.Component {
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

  render() {
    const cls = classNames('PinOverlay', {
      'is-highlighted': this.props.isSelected || this.props.isAcceptingLinks,
    });

    const pinCircleCenter = {
      cx: this.props.position.x,
      cy: this.props.position.y,
    };

    return (
      <g
        className={cls}
        onMouseUp={this.onMouseUp}
        onMouseDown={this.onMouseDown}
        onMouseOver={this.handleOver}
        onMouseOut={this.handleOut}
      >
        <circle
          className="linkingHighlight"
          {...pinCircleCenter}
          r={PIN_HIGHLIGHT_RADIUS}
        />
        <circle
          className="symbol"
          {...pinCircleCenter}
          r={PIN_RADIUS}
        />
      </g>
    );
  }
}

PinOverlay.propTypes = {
  keyName: React.PropTypes.string.isRequired,
  position: React.PropTypes.object.isRequired,
  onMouseUp: React.PropTypes.func.isRequired,
  onMouseDown: React.PropTypes.func.isRequired,
  isSelected: React.PropTypes.bool,
  isAcceptingLinks: React.PropTypes.bool,
};
