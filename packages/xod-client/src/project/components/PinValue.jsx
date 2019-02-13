import React from 'react';
import PropTypes from 'prop-types';
import cls from 'classnames';
import { PIN_TYPE, INPUT_PULSE_PIN_BINDING_OPTIONS } from 'xod-project';
import { unquote } from 'xod-func-tools';

import { PINVALUE_WIDTH, getPinValueProps } from '../nodeLayout';
import { getRenderablePinType } from '../utils';

const formatPulsePinValue = value => {
  switch (value) {
    case INPUT_PULSE_PIN_BINDING_OPTIONS.CONTINUOUSLY:
      return 'Loop';
    case INPUT_PULSE_PIN_BINDING_OPTIONS.ON_BOOT:
      return 'Boot';
    default:
    case INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER:
      return '';
  }
};

const formatPinValue = (type, value) => {
  switch (type) {
    case PIN_TYPE.STRING:
      return unquote(value);
    case PIN_TYPE.PULSE:
      return formatPulsePinValue(value);
    default:
      return value;
  }
};

const PinValue = ({ value, type, deducedType, direction, position }) => {
  const textProps = getPinValueProps(direction, position);

  const pinType = getRenderablePinType({ type, deducedType });
  const className = cls('PinValue', pinType);

  return value ? (
    <foreignObject {...textProps}>
      <div
        className={className}
        xmlns="http://www.w3.org/1999/xhtml"
        style={{ width: PINVALUE_WIDTH }}
      >
        {formatPinValue(pinType, value)}
      </div>
    </foreignObject>
  ) : null;
};

PinValue.propTypes = {
  value: PropTypes.string,
  type: PropTypes.string,
  deducedType: PropTypes.object,
  direction: PropTypes.string.isRequired,
  position: PropTypes.object.isRequired,
};

export default PinValue;
