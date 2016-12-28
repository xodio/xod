import React from 'react';
import classNames from 'classnames';
import { noop } from '../../../utils/ramda';

const NumberWidget = (props) => {
  const cls = classNames('NumberWidget', {
    'is-disabled': props.disabled,
  });
  const onChange = (event) => {
    props.onChange(event.target.value);
  };
  return (
    <div className={cls}>
      <input
        type="text"
        id={props.elementId}
        value={props.value}

        disabled={props.disabled}
        autoFocus={props.focused}

        onChange={onChange}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        onKeyDown={props.onKeyDown}
      />
      <label
        htmlFor={props.elementId}
      >
        {props.label}
      </label>
    </div>
  );
};

NumberWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  value: React.PropTypes.number,
  disabled: React.PropTypes.bool,
  focused: React.PropTypes.bool,
  onFocus: React.PropTypes.func,
  onBlur: React.PropTypes.func,
  onChange: React.PropTypes.func,
  onKeyDown: React.PropTypes.func,
};

NumberWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
  disabled: false,
  focused: false,
  onFocus: noop,
  onBlur: noop,
  onChange: noop,
  onKeyDown: noop,
};

export default NumberWidget;
