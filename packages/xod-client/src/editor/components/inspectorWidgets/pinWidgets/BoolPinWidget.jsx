import React from 'react';

import { PROPERTY_TYPE } from '../../../constants';
import PinIcon from './PinIcon';

function BoolWidget(props) {
  const onChange = (event) => {
    const boolValue = JSON.parse(event.target.value);
    props.onChange(boolValue);
  };
  return (
    <div className="Widget PinWidget BoolWidget">
      <select
        className="inspectorSelectInput"
        id={props.elementId}
        value={JSON.stringify(props.value)}
        disabled={props.disabled}
        onChange={onChange}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      >
        <option value="false">false</option>
        <option value="true">true</option>
      </select>
      <PinIcon
        id={props.elementId}
        type={PROPERTY_TYPE.BOOL}
        isConnected={props.disabled}
      />
      <label
        htmlFor={props.elementId}
      >
        {props.label}
      </label>
    </div>
  );
}

BoolWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  value: React.PropTypes.bool,
  disabled: React.PropTypes.bool,
  onChange: React.PropTypes.func.isRequired,
  onFocus: React.PropTypes.func.isRequired,
  onBlur: React.PropTypes.func.isRequired,
};

BoolWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
  disabled: false,
};

export default BoolWidget;
