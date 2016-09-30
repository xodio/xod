import React from 'react';
import classNames from 'classnames';
import { noop } from 'xod-client/utils/ramda';
import { PROPERTY_TYPE_PARSE } from 'xod-core/project/constants';

function BoolWidget({ keyName, label, value, disabled, onPropUpdate }) {
  const elementId = `widget_${keyName}`;
  const onChange = (event) => {
    const val = event.target.checked;
    const newValue = PROPERTY_TYPE_PARSE.bool(val);
    onPropUpdate(newValue);
  };

  const cls = classNames('BoolWidget', {
    'is-disabled': disabled,
  });

  return (
    <div className={cls}>
      <input
        id={elementId}
        type="checkbox"
        value="1"
        checked={value}
        disabled={disabled}
        onChange={onChange}
      />
      <label
        htmlFor={elementId}
      >
        {label}
      </label>
    </div>
  );
}

BoolWidget.propTypes = {
  keyName: React.PropTypes.string,
  label: React.PropTypes.string,
  value: React.PropTypes.bool,
  disabled: React.PropTypes.bool,
  onPropUpdate: React.PropTypes.func,
};

BoolWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
  disabled: false,
  onPropUpdate: noop,
};

export default BoolWidget;
