import React from 'react';
import PropTypes from 'prop-types';

import { PINLABEL_WIDTH, getPinLabelProps } from '../nodeLayout';

const PinLabel = ({ label, direction, position }) => {
  const textProps = getPinLabelProps(direction, position);

  return label ? (
    <foreignObject {...textProps}>
      <div
        className="PinLabel"
        xmlns="http://www.w3.org/1999/xhtml"
        style={{ width: PINLABEL_WIDTH }}
      >
        {label}
      </div>
    </foreignObject>
  ) : null;
};

PinLabel.propTypes = {
  label: PropTypes.string,
  direction: PropTypes.string.isRequired,
  position: PropTypes.object.isRequired,
};

export default PinLabel;
