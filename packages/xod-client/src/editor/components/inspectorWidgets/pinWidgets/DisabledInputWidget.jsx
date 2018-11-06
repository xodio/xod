import React from 'react';
import PropTypes from 'prop-types';

import PinWidget from './PinWidget';

const DisabledInputWidget = props => (
  <PinWidget
    elementId={props.elementId}
    label={props.label}
    dataType={props.dataType}
    isConnected={props.isConnected}
    isLastVariadicGroup={props.isLastVariadicGroup}
    isBindable={props.isBindable}
    direction={props.direction}
  />
);

DisabledInputWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isLastVariadicGroup: PropTypes.bool,
  isBindable: PropTypes.bool,
  direction: PropTypes.string,
};

DisabledInputWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
};

export default DisabledInputWidget;
