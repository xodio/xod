import React from 'react';
import classNames from 'classnames';

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
  disabled: React.PropTypes.bool,
  onChange: React.PropTypes.func.isRequired,
};

BoolWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
  disabled: false,
};

export default BoolWidget;
