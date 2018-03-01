import React from 'react';
import PropTypes from 'prop-types';

import PinWidget from './PinWidget';

const StringWidget = (props) => {
  const onChange = (event) => {
    props.onChange(event.target.value);
  };

  return (
    <PinWidget
      elementId={props.elementId}
      label={props.label}
      normalizedLabel={props.normalizedLabel}
      dataType={props.dataType}
      isConnected={props.isConnected}
      isLastVariadicGroup={props.isLastVariadicGroup}
      isBindable={props.isBindable}
      direction={props.direction}
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
  elementId: PropTypes.string.isRequired,
  normalizedLabel: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isLastVariadicGroup: PropTypes.bool,
  isBindable: PropTypes.bool,
  direction: PropTypes.string,

  value: PropTypes.string,
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
};

StringWidget.defaultProps = {
  label: 'Unnamed property',
  value: '',
  disabled: false,
};

export default StringWidget;
