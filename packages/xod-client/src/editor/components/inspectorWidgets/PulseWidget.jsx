import R from 'ramda';
import React from 'react';
import classNames from 'classnames';

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
  onBlur: React.PropTypes.func.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onKeyDown: React.PropTypes.func.isRequired,
};

PulseWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
  disabled: false,
};

export default PulseWidget;
