import React from 'react';
import Switch from '../InspectorModeSwitch';
import { PROPERTY_KIND } from '../../../project/constants';

export default function composeWidget(Component) {
  class Widget extends React.Component {
    getSwitch() {
      if (this.isModeSwitchable()) {
        return (
          <Switch
            injected={this.props.injected}
            onSwitch={this.props.onPinModeSwitch}
          />
        );
      }

      return null;
    }

    isModeSwitchable() {
      return (this.props.kind !== PROPERTY_KIND.PROP);
    }

    isDisabled() {
      return this.isModeSwitchable() && !this.props.injected;
    }

    render() {
      return (
        <div className="InspectorWidget">
          {this.getSwitch()}
          <Component
            label={this.props.label}
            value={this.props.value}
            onPropUpdate={this.props.onPropUpdate}
            disabled={this.isDisabled()}
          />
        </div>
      );
    }
  }

  Widget.propTypes = {
    label: React.PropTypes.string.isRequired,
    value: React.PropTypes.any.isRequired,
    injected: React.PropTypes.bool,
    kind: React.PropTypes.string,
    onPropUpdate: React.PropTypes.func.isRequired,
    onPinModeSwitch: React.PropTypes.func,
  };

  Widget.defaultProps = {
    value: null,
  };

  return Widget;
}
