import React from 'react';
import Switch from 'rc-switch';
import { Icon } from 'react-fa';

function InspectorModeSwitch({ injected, onSwitch }) {
  const iconProp = <Icon name="caret-down" />;
  const iconPin = <Icon name="circle-o" />;

  return (
    <Switch
      className="InspectorModeSwitch"
      checked={injected}
      onChange={onSwitch}
      checkedChildren={iconProp}
      unCheckedChildren={iconPin}
    />
  );
}

InspectorModeSwitch.propTypes = {
  injected: React.PropTypes.bool,
  onSwitch: React.PropTypes.func,
};

export default InspectorModeSwitch;
