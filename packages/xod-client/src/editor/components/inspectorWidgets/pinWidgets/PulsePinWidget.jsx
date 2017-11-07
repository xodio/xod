import React from 'react';
import PropTypes from 'prop-types';

import { INPUT_PULSE_PIN_BINDING_OPTIONS } from 'xod-project';

import PinWidget from './PinWidget';

const PulseWidget = props => {
  const onChange = event => {
    props.onChange(event.target.value);
  };

  return (
    <PinWidget
      elementId={props.elementId}
      label={props.label}
      normalizedLabel={props.normalizedLabel}
      dataType={props.dataType}
      isConnected={props.isConnected}
      isBindable={props.isBindable}
      direction={props.direction}
    >
      <select
        className="inspectorSelectInput"
        id={props.elementId}
        value={props.value}
        onChange={onChange}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      >
        <option value={INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER}>Never</option>
        <option value={INPUT_PULSE_PIN_BINDING_OPTIONS.ON_BOOT}>On boot</option>
        <option value={INPUT_PULSE_PIN_BINDING_OPTIONS.CONTINUOUSLY}>
          Continuously
        </option>
      </select>
    </PinWidget>
  );
};

PulseWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  normalizedLabel: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isBindable: PropTypes.bool,
  direction: PropTypes.string,

  value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  onChange: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

export default PulseWidget;
