import React from 'react';
import PropTypes from 'prop-types';

import PinWidget from './PinWidget';

function BoolWidget(props) {
  const onChange = (event) => {
    const boolValue = JSON.parse(event.target.value);
    props.onChange(boolValue);
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
        value={JSON.stringify(props.value)}
        onChange={onChange}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      >
        <option value="false">false</option>
        <option value="true">true</option>
      </select>
    </PinWidget>
  );
}

BoolWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  label: PropTypes.string,
  normalizedLabel: PropTypes.string.isRequired,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isBindable: PropTypes.bool,
  direction: PropTypes.string,

  value: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

BoolWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
};

export default BoolWidget;
