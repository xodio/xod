import React from 'react';

import PinWidget from './PinWidget';

const StringWidget = (props) => {
  const onChange = (event) => {
    props.onChange(event.target.value);
  };

  return (
    <PinWidget
      elementId={props.elementId}
      label={props.label}
      dataType={props.dataType}
      isConnected={props.isConnected}
      isBindable={props.isBindable}
    >
      <input
        className="inspectorTextInput"
        type="text"
        id={props.elementId}
        value={props.value}
        onChange={onChange}
        onBlur={props.onBlur}
        onKeyDown={props.onKeyDown}
      />
    </PinWidget>
  );
};

StringWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  dataType: React.PropTypes.string,
  isConnected: React.PropTypes.bool,
  isBindable: React.PropTypes.bool,

  value: React.PropTypes.string,
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
