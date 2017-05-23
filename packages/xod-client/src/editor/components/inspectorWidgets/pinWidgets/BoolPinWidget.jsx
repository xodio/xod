import React from 'react';
import PinWidget from './PinWidget';

function BoolWidget(props) {
  const onChange = (event) => {
    const boolValue = JSON.parse(event.target.value);
    props.onChange(boolValue);
  };

  return (
    <PinWidget {...props}>
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
  elementId: React.PropTypes.string.isRequired,
  value: React.PropTypes.bool,
  onChange: React.PropTypes.func.isRequired,
  onFocus: React.PropTypes.func.isRequired,
  onBlur: React.PropTypes.func.isRequired,
};

BoolWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
};

export default BoolWidget;
