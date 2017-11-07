import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import PinWidget from './PinWidget';

const NumberWidget = props => {
  const onChange = R.compose(props.onChange, R.path(['target', 'value']));

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
      <input
        className="inspectorTextInput inspectorTextInput--number"
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

NumberWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  normalizedLabel: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isBindable: PropTypes.bool,
  direction: PropTypes.string,

  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
};

NumberWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
};

export default NumberWidget;
