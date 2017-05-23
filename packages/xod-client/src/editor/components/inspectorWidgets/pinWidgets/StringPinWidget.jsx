import React from 'react';

import PinWidget from './PinWidget';

const StringWidget = (props) => {
  const onChange = (event) => {
    props.onChange(event.target.value);
  };

  return (
    <PinWidget {...props}>
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
