import R from 'ramda';
import React from 'react';

import PinIcon from './PinIcon';

const getNonBindableReason = R.cond([
  [R.complement(R.prop('isBindable')), R.always('defined by inputs')],
  [R.prop('isConnected'), R.always('linked')],
]);

function PinWidget(props) {
  const input = (props.isConnected || !props.isBindable)
    ? (
      <input
        className="inspectorTextInput inspectorTextInput--not-bindable"
        type="text"
        disabled
        value={getNonBindableReason(props)}
      />
    ) : props.children;

  return (
    <div className="Widget PinWidget">
      {input}
      <PinIcon
        id={props.elementId}
        type={props.dataType}
        isConnected={props.isConnected}
      />
      <label
        htmlFor={props.elementId}
      >
        {props.label}
      </label>
    </div>
  );
}

PinWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  dataType: React.PropTypes.string,
  isConnected: React.PropTypes.bool,
  isBindable: React.PropTypes.bool,
  children: React.PropTypes.element.isRequired,
};

PinWidget.defaultProps = {
  label: 'Unnamed property',
};

export default PinWidget;
