import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const IOLabelWidget = props => {
  const cls = classNames('IOLabelWidget', {});
  const onChange = event => {
    const val = event.target.value;
    if (!/^([a-zA-Z0-9]){0,4}$/.test(val)) {
      return;
    }
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
      <label htmlFor={props.elementId}>{props.label}</label>
    </div>
  );
};

IOLabelWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.string,
  disabled: PropTypes.bool,
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
};

IOLabelWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
  disabled: false,
};

export default IOLabelWidget;
