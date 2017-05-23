import React from 'react';

import PinWidget from './PinWidget';

const PulseWidget = props => (
  <PinWidget {...props}>
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
};

export default PulseWidget;
