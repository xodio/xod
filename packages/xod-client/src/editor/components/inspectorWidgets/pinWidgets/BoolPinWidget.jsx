import React from 'react';
import PropTypes from 'prop-types';

import PinWidget from './PinWidget';

function BoolWidget(props) {
  const onChange = event => props.onChange(event.target.value);

  return (
    <PinWidget
      elementId={props.elementId}
      label={props.label}
      dataType={props.dataType}
      isConnected={props.isConnected}
      isInvalid={props.isInvalid}
      deducedType={props.deducedType}
      isLastVariadicGroup={props.isLastVariadicGroup}
      isBindable={props.isBindable}
      direction={props.direction}
    >
      <select
        className="inspectorSelectInput"
        id={props.elementId}
        value={props.value}
        onChange={onChange}
        onBlur={props.onBlur}
      >
        <option value="False">False</option>
        <option value="True">True</option>
      </select>
    </PinWidget>
  );
}

BoolWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isInvalid: PropTypes.bool,
  isLastVariadicGroup: PropTypes.bool,
  isBindable: PropTypes.bool,
  deducedType: PropTypes.object,
  direction: PropTypes.string,

  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

BoolWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
};

export default BoolWidget;
