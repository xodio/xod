import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import { noop } from '../../../utils/ramda';

const PulseWidget = (props) => {
  const inputs = {
    select: null,
    input: null,
  };
  const cls = classNames('PulseWidget', {
    'is-disabled': props.disabled,
  });
  // :: { select, input } -> [ select.value, input.value ]
  const prepareValue = R.compose(
    R.pluck('value'),
    R.values
  );
  const onChange = () => props.onChange(prepareValue(inputs));
  // :: string -> array
  const getValue = R.split(',');

  return (
    <div className={cls}>
      <input
        ref={c => (inputs.input = c)}
        type="text"
        value={getValue(props.value)[1]}
        disabled={props.disabled}
        autoFocus={props.focused}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onChange={onChange}
        onKeyDown={props.onKeyDown}
      />
      <select
        ref={c => (inputs.select = c)}
        id={props.elementId}
        value={getValue(props.value)[0]}
        disabled={props.disabled}
        onChange={onChange}
      >
        <option value="once">Once</option>
        <option value="every">Every</option>
      </select>
      <label
        htmlFor={props.elementId}
      >
        {props.label}
      </label>
    </div>
  );
};

PulseWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  value: React.PropTypes.string,
  disabled: React.PropTypes.bool,
  focused: React.PropTypes.bool,
  onFocus: React.PropTypes.func,
  onBlur: React.PropTypes.func,
  onChange: React.PropTypes.func,
  onKeyDown: React.PropTypes.func,
};

PulseWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
  disabled: false,
  focused: false,
  onFocus: noop,
  onBlur: noop,
  onChange: noop,
  onKeyDown: noop,
};

export default PulseWidget;
