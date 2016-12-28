import R from 'ramda';
import React from 'react';
import { KEYCODE } from '../../../utils/constants';
import { noop } from '../../../utils/ramda';
import Switch from '../InspectorModeSwitch';
import { PROPERTY_KIND } from '../../../project/constants';
import { PROPERTY_TYPE_PARSE } from 'xod-core';

export default function composeWidget(Component, widgetProps) {
  const commonKeyDownHandlers = {
    [KEYCODE.ENTER]: function enter(event) {
      event.preventDefault();
      this.commit();
    },
    [KEYCODE.ESCAPE]: function escape(event) {
      if (this.state.value === this.state.initialValue) {
        event.target.blur();
      } else {
        this.updateValue(this.state.initialValue);
      }
    },
  };

  class Widget extends React.Component {
    constructor(props) {
      super(props);
      this.type = widgetProps.type;

      const val = this.parseValue(props.value);
      this.state = {
        initialValue: val,
        value: val,
      };

      this.keyDownHandlers = R.compose(
        R.map(fn => fn.bind(this)),
        R.merge(commonKeyDownHandlers),
        R.propOr({}, 'keyDownHandlers')
      )(widgetProps);

      this.onChange = this.onChange.bind(this);
      this.onBlur = this.onBlur.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
    }
    // componentWillUnmount() {
      // What shall we do here to commit changed value,
      // but prevent commit it twice (in Blur and here)?
    // }

    onFocus() {
      this.props.onFocusChanged(true);
    }
    onBlur() {
      this.props.onFocusChanged(false);
      this.commit();
    }
    onChange(value) {
      this.updateValue(value);
    }
    onKeyDown(event) {
      const keycode = event.keycode || event.which;
      if (this.keyDownHandlers[keycode]) {
        this.keyDownHandlers[keycode].call(this, event);
      }
    }

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

    updateValue(value) {
      const newValue = this.parseValue(value);
      this.setState({
        value: newValue,
      });
    }

    commit() {
      if (this.state.value !== this.props.value) {
        this.props.onPropUpdate(this.state.value);
      }
    }

    parseValue(val) {
      return PROPERTY_TYPE_PARSE[this.type](val);
    }

    render() {
      const elementId = `widget_${this.props.keyName}`;
      return (
        <div className="InspectorWidget">
          {this.getSwitch()}
          <Component
            elementId={elementId}
            label={this.props.label}
            value={this.state.value}
            disabled={this.isDisabled()}
            focused={this.props.focused && !this.isDisabled()}
            onBlur={this.onBlur}
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
          />
        </div>
      );
    }
  }

  Widget.propTypes = {
    keyName: React.PropTypes.string.isRequired, // ?
    kind: React.PropTypes.string,
    // type: React.PropTypes.string.isRequired,
    label: React.PropTypes.string,
    value: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.bool,
      React.PropTypes.array,
    ]),
    injected: React.PropTypes.bool,
    focused: React.PropTypes.bool,
    // dispatchers
    onPropUpdate: React.PropTypes.func.isRequired,
    onPinModeSwitch: React.PropTypes.func,
    onFocusChanged: React.PropTypes.func,
  };

  Widget.defaultProps = {
    className: '',
    label: 'Unknown property',
    value: '',
    focused: false,
    onPropUpdate: noop,
    onPinModeSwitch: noop,
    onFocusChanged: noop,
  };

  return Widget;
}
