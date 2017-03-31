import React from 'react';
import { PIN_DIRECTION } from '../../editor/constants';

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
    return this.props.pinLabel ? (
      <text
        className={`PinLabel ${this.isInput() ? 'input' : 'output'}`}
        key={`pinText_${this.props.keyName}`}
        {...this.getTextProps()}
      >
        {this.props.pinLabel}
      </text>
    ) : null;
  }
}

Pin.propTypes = {
  keyName: React.PropTypes.string.isRequired,
  pinLabel: React.PropTypes.string,
  direction: React.PropTypes.string.isRequired,
  position: React.PropTypes.object.isRequired,
};
