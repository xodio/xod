import React from 'react';
import PropTypes from 'prop-types';

import PinWidget from './PinWidget';

const DeadWidget = props => (
  <PinWidget
    elementId={props.elementId}
    label={props.label}
    normalizedLabel={props.normalizedLabel}
    dataType={props.dataType}
    isConnected={props.isConnected}
    isBindable={props.isBindable}
    direction={props.direction}
  />
);

DeadWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  normalizedLabel: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isBindable: PropTypes.bool,
  direction: PropTypes.string,
};

DeadWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
};

export default DeadWidget;
