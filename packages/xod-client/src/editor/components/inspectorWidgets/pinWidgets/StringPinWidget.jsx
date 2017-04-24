import React from 'react';

import { PROPERTY_TYPE } from '../../../constants';
import PinIcon from './PinIcon';
import LinkedInput from './LinkedInput';

const StringWidget = (props) => {
  const onChange = (event) => {
    props.onChange(event.target.value);
  };

  const input = props.disabled
    ? (
      <LinkedInput id={props.elementId} />
    ) : (
      <input
        className="inspectorTextInput"
        type="text"
        id={props.elementId}
        value={props.value}

        onChange={onChange}
        onBlur={props.onBlur}
        onKeyDown={props.onKeyDown}
      />
    );

  return (
    <div className="Widget PinWidget StringWidget">
      {input}
      <PinIcon
        id={props.elementId}
        type={PROPERTY_TYPE.STRING}
        isConnected={props.disabled}
      />
      <label
        htmlFor={props.elementId}
      >
        {props.label}
      </label>
    </div>
  );
};

StringWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  value: React.PropTypes.string,
  disabled: React.PropTypes.bool,
  onBlur: React.PropTypes.func.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onKeyDown: React.PropTypes.func.isRequired,
};

StringWidget.defaultProps = {
  label: 'Unnamed property',
  value: '',
  disabled: false,
};

export default StringWidget;
