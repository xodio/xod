import React from 'react';
import PropTypes from 'prop-types';
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
  keyName: PropTypes.string.isRequired,
  position: PropTypes.object.isRequired,
  onMouseUp: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  isAcceptingLinks: PropTypes.bool,
};
