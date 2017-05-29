import R from 'ramda';
import React from 'react';

import { PIN_DIRECTION } from 'xod-project';

import PinIcon from './PinIcon';

// TODO: move these checks

const isLinkedInput = R.both(
  R.pipe(R.prop('direction'), R.equals(PIN_DIRECTION.INPUT)),
  R.prop('isConnected')
);

const isNonBindableOutput = R.both(
  R.pipe(R.prop('direction'), R.equals(PIN_DIRECTION.OUTPUT)),
  R.complement(R.prop('isBindable'))
);

const isBindingForbidden = R.either(
  isLinkedInput,
  isNonBindableOutput
);

const getReason = R.cond([
  [isNonBindableOutput, R.always('defined by inputs')],
  [isLinkedInput, R.always('linked')],
]);

function PinWidget(props) {
  const input = isBindingForbidden(props)
    ? (
      <input
        className="inspectorTextInput inspectorTextInput--not-bindable"
        type="text"
        disabled
        value={getReason(props)}
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
  isBindable: React.PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
  children: React.PropTypes.element.isRequired,
};

PinWidget.defaultProps = {
  label: 'Unnamed property',
};

export default PinWidget;
