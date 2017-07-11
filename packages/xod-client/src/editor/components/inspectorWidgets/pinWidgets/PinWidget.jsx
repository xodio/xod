import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { PIN_DIRECTION, PIN_TYPE } from 'xod-project';

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

const isPulsePin = R.pipe(R.prop('dataType'), R.equals(PIN_TYPE.PULSE));

const getReason = R.cond([
  [isLinkedInput, R.always('linked')],
  [R.both(isNonBindableOutput, isPulsePin), R.always('pulse')],
  // the only option left is that it's not bindable
  // because it belongs to a functional node
  [R.T, R.always('defined by inputs')],
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
    <div className="Widget PinWidget" title={props.normalizedLabel}>
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
  elementId: PropTypes.string.isRequired,
  normalizedLabel: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isBindable: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
  direction: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  children: PropTypes.element.isRequired,
};

PinWidget.defaultProps = {
  label: 'Unnamed property',
};

export default PinWidget;
