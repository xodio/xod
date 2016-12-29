import React from 'react';
import classNames from 'classnames';
import { noop } from '../../../utils/ramda';

// Почему-то не этот компонент цепляется %)
const IOLabelWidget = (props) => {
  const cls = classNames('IOLabelWidget', {
    'is-disabled': props.disabled,
  });
  const onChange = (event) => {
    const val = event.target.value;
    if (!(/^([a-zA-Z0-9]){0,4}$/.test(val))) { return; }
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
      />
      <label
        htmlFor={props.elementId}
      >
        {props.label}
      </label>
    </div>
  );
};

IOLabelWidget.propTypes = {
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

IOLabelWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
  disabled: false,
  focused: false,
  onFocus: noop,
  onBlur: noop,
  onChange: noop,
  onKeyDown: noop,
};

export default IOLabelWidget;
