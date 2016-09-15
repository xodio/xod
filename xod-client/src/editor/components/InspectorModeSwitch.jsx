import React from 'react';
import Switch from 'rc-switch';

function InspectorModeSwitch({ mode, onSwitch }) {
  const checked = (mode === 'property');

  return (
    <Switch
      className="InspectorModeSwitch"
      checked={checked}
      onChange={onSwitch}
      checkedChildren={'∆'}
      uncheckedChildren={'o'}
    />
  );
}

InspectorModeSwitch.propTypes = {
  mode: React.PropTypes.string,
  onSwitch: React.PropTypes.func,
};

export default InspectorModeSwitch;
