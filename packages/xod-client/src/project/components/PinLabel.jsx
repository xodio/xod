import React from 'react';
import PropTypes from 'prop-types';
import { PIN_DIRECTION } from 'xod-project';

import { PIN_RADIUS, TEXT_OFFSET_FROM_PIN_BORDER } from '../nodeLayout';

const Pin = ({ keyName, label, direction, position }) => {
  const textVerticalOffset = PIN_RADIUS + TEXT_OFFSET_FROM_PIN_BORDER;
  const isInput = direction === PIN_DIRECTION.INPUT;

  const textProps = {
    x: position.x,
    y: position.y + (textVerticalOffset * (isInput ? -1 : 1)),
    textAnchor: 'middle',
  };

  return label ? (
    <g key={`pinText_${keyName}`}>
      <text
        className="PinLabel outline"
        {...textProps}
      >
        {label}
      </text>
      <text
        className="PinLabel"
        {...textProps}
      >
        {label}
      </text>
    </g>
  ) : null;
};

Pin.propTypes = {
  keyName: PropTypes.string.isRequired,
  label: PropTypes.string,
  direction: PropTypes.string.isRequired,
  position: PropTypes.object.isRequired,
};

export default Pin;
