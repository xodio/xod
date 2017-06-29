import React from 'react';
import PropTypes from 'prop-types';
import { PIN_DIRECTION } from 'xod-project';

import { PIN_RADIUS, TEXT_OFFSET_FROM_PIN_BORDER } from '../nodeLayout';

export default class Pin extends React.Component {
  getPinCenter() {
    return this.props.position;
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

  render() {
    return this.props.label ? (
      <text
        className={`PinLabel ${this.isInput() ? 'input' : 'output'}`}
        key={`pinText_${this.props.keyName}`}
        {...this.getTextProps()}
      >
        {this.props.label}
      </text>
    ) : null;
  }
}

Pin.propTypes = {
  keyName: PropTypes.string.isRequired,
  label: PropTypes.string,
  direction: PropTypes.string.isRequired,
  position: PropTypes.object.isRequired,
};
