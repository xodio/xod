import React from 'react';
import classNames from 'classnames';
import { noop } from '../../../utils/ramda';

function BoolWidget(props) {
  const cls = classNames('BoolWidget', {
    'is-disabled': props.disabled,
  });
  const onChange = (event) => {
    props.onChange(event.target.checked);
  };
  return (
    <div className={cls}>
      <input
        id={props.elementId}
        type="checkbox"
        value="1"
        checked={props.value}
        disabled={props.disabled}
        onChange={onChange}
      />
      <label
        htmlFor={props.elementId}
      >
        {props.label}
      </label>
    </div>
  );
}

BoolWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  value: React.PropTypes.bool,
  focused: React.PropTypes.bool,
  disabled: React.PropTypes.bool,
  onFocus: React.PropTypes.func,
  onBlur: React.PropTypes.func,
  onChange: React.PropTypes.func,
};

BoolWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
  disabled: false,
  focused: false,
  onFocus: noop,
  onBlur: noop,
  onChange: noop,
  onKeyDown: noop,
};

export default BoolWidget;
