import React from 'react';

function BoolWidget({ keyName, label, value, onPropUpdate }) {
  const elementId = `widget_${keyName}`;
  const onChange = (event) => {
    const newValue = Boolean(event.target.checked);
    onPropUpdate(newValue);
  };

  return (
    <div className="BoolWidget">
      <input
        id={elementId}
        type="checkbox"
        value="1"
        checked={value}
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
  nodeId: React.PropTypes.number,
  keyName: React.PropTypes.string,
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
