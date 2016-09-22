import React from 'react';
import Switch from '../InspectorModeSwitch';
import { PROPERTY_KIND } from 'xod-client/project/constants';

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

    isProperty() {

    }

    isPin() {

    }

    isDisabled() {
      return this.isModeSwitchable() && !this.props.injected;
    }

    render() {
      return (
        <div className="InspectorWidget">
          {this.getSwitch()}
          <Component
            {...this.props}
            disabled={this.isDisabled()}
          />
        </div>
      );
    }
  }

  Widget.propTypes = {
    key: React.PropTypes.string,
    label: React.PropTypes.string,
    value: React.PropTypes.any,
    injected: React.PropTypes.bool,
    kind: React.PropTypes.string,
    onPropUpdate: React.PropTypes.func,
    onPinModeSwitch: React.PropTypes.func,
  };

  Widget.defaultProps = {
    value: null,
  };

  return Widget;
}
