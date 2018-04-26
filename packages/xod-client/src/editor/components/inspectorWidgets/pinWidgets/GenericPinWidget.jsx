import React from 'react';
import PropTypes from 'prop-types';

import PinWidget from './PinWidget';

const GenericPinWidget = props => (
  <PinWidget
    elementId={props.elementId}
    label={props.label}
    normalizedLabel={props.normalizedLabel}
    dataType={props.dataType}
    isConnected={props.isConnected}
    isInvalid={props.isInvalid}
    deducedType={props.deducedType}
    isLastVariadicGroup={props.isLastVariadicGroup}
    isBindable={props.isBindable}
    direction={props.direction}
  >
    <input
      className="inspectorTextInput"
      type="text"
      id={props.elementId}
      value={props.value}
      onChange={event => props.onChange(event.target.value)}
      onBlur={props.onBlur}
      onKeyDown={props.onKeyDown}
      spellCheck={false}
    />
  </PinWidget>
);

GenericPinWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  normalizedLabel: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isInvalid: PropTypes.bool,
  isLastVariadicGroup: PropTypes.bool,
  isBindable: PropTypes.bool,
  deducedType: PropTypes.object,
  direction: PropTypes.string,

  onBlur: PropTypes.func.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
};

GenericPinWidget.defaultProps = {
  label: 'Unnamed property',
  value: '',
  disabled: false,
};

export default GenericPinWidget;
