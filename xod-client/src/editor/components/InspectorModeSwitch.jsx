import React from 'react';
import Switch from 'rc-switch';
import { PROPERTY_MODE } from 'xod-client/project/constants';

function InspectorModeSwitch({ mode, onSwitch }) {
  const checked = (mode === PROPERTY_MODE.PROP);

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
