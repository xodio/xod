import React from 'react';

function BoolWidget({ nodeId, key, label, value, onPropUpdate }) {
  const elementId = `widget_${nodeId}_${key}`;
  const onChange = (event) => {
    const newValue = Boolean(event.target.checked);
    onPropUpdate(newValue);
  };

  return (
    <div className="BoolWidget">
      <label
        htmlFor={elementId}
      >
        {label}
      </label>
      <input
        id={elementId}
        type="checkbox"
        value="1"
        checked={value}
        onChange={onChange}
      />
    </div>
  );
}

BoolWidget.propTypes = {
  nodeId: React.PropTypes.number,
  key: React.PropTypes.string,
  label: React.PropTypes.string,
  value: React.PropTypes.bool,
  onPropUpdate: React.PropTypes.func,
};

BoolWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
  onPropUpdate: f => f,
};

export default BoolWidget;
