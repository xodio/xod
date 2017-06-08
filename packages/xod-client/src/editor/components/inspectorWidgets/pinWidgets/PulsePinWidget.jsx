import React from 'react';

import PinWidget from './PinWidget';

const PulseWidget = props => (
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
      className="inspectorTextInput"
      id={props.elementId}
      type="text"
      value="pulse"
      disabled
    />
  </PinWidget>
);

PulseWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  normalizedLabel: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  dataType: React.PropTypes.string,
  isConnected: React.PropTypes.bool,
  isBindable: React.PropTypes.bool,
  direction: React.PropTypes.string,
};

export default PulseWidget;
