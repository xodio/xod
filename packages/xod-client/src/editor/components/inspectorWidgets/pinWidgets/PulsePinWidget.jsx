import React from 'react';

import { PROPERTY_TYPE } from '../../../constants';
import PinIcon from './PinIcon';

const PulseWidget = props => (
  <div className="Widget PinWidget PulseWidget">
    <input
      className="inspectorTextInput"
      id={props.elementId}
      type="text"
      value="pulse"
      disabled
    />
    <PinIcon
      id={props.elementId}
      type={PROPERTY_TYPE.PULSE}
      isConnected={props.disabled}
    />
    <label
      htmlFor={props.elementId}
    >
      {props.label}
    </label>
  </div>
);

PulseWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  disabled: React.PropTypes.bool,
};

PulseWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
  disabled: false,
};

export default PulseWidget;
