import React from 'react';

import { PROPERTY_TYPE } from '../../../constants';
import PinIcon from './PinIcon';
import LinkedInput from './LinkedInput';

const NumberWidget = (props) => {
  const onChange = (event) => {
    props.onChange(event.target.value);
  };

  const input = props.disabled
    ? (
      <LinkedInput id={props.elementId} />
    ) : (
      <input
        className="inspectorTextInput inspectorTextInput--number"
        type="text"
        id={props.elementId}
        value={props.value}

        onChange={onChange}
        onBlur={props.onBlur}
        onKeyDown={props.onKeyDown}
      />
    );

  return (
    <div className="Widget PinWidget NumberWidget">
      {input}
      <PinIcon
        id={props.elementId}
        type={PROPERTY_TYPE.NUMBER}
        isConnected={props.disabled}
      />
      <label
        className=""
        htmlFor={props.elementId}
      >
        {props.label}
      </label>
    </div>
  );
};

NumberWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  value: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
  ]),
  disabled: React.PropTypes.bool,
  onBlur: React.PropTypes.func.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onKeyDown: React.PropTypes.func.isRequired,
};

NumberWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
  disabled: false,
};

export default NumberWidget;
