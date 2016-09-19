import React from 'react';
import Switch from 'rc-switch';
import { PROPERTY_MODE } from 'xod-client/project/constants';
import { Icon } from 'react-fa';

function InspectorModeSwitch({ mode, onSwitch }) {
  const checked = (mode === PROPERTY_MODE.PROP);
  const iconProp = <Icon name="caret-down" />;
  const iconPin = <Icon name="circle-o" />;

  return (
    <Switch
      className="InspectorModeSwitch"
      checked={checked}
      onChange={onSwitch}
      checkedChildren={iconProp}
      unCheckedChildren={iconPin}
    />
  );
}

InspectorModeSwitch.propTypes = {
  mode: React.PropTypes.string,
  onSwitch: React.PropTypes.func,
};

export default InspectorModeSwitch;
