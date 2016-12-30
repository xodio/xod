import React from 'react';
import classNames from 'classnames';

const StringWidget = (props) => {
  const cls = classNames('StringWidget', {
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

        onChange={onChange}
        onBlur={props.onBlur}
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

StringWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  value: React.PropTypes.string,
  disabled: React.PropTypes.bool,
  onBlur: React.PropTypes.func.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onKeyDown: React.PropTypes.func.isRequired,
};

StringWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
  disabled: false,
};

export default StringWidget;
