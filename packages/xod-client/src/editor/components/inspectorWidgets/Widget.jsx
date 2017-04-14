import R from 'ramda';
import React from 'react';
import { PROPERTY_TYPE_PARSE, PROPERTY_TYPE_MASK } from '../../../utils/inputFormatting';

import { KEYCODE } from '../../../utils/constants';
import { noop } from '../../../utils/ramda';
import { NODE_PROPERTY_KIND } from '../../../project/constants';

export default function composeWidget(Component, widgetProps) {
  const commonKeyDownHandlers = {
    [KEYCODE.ENTER]: function enter(event) {
      event.preventDefault();
      this.commit();
    },
    [KEYCODE.ESCAPE]: function escape(event) {
      if (this.state.value === this.parseValue(this.props.value)) {
        event.target.blur();
      } else {
        this.updateValue(this.props.value);
      }
    },
  };

  class Widget extends React.Component {
    constructor(props) {
      super(props);
      this.type = widgetProps.type;
      this.commitOnChange = widgetProps.commitOnChange;

      const val = this.parseValue(props.value);
      this.state = {
        value: val,
      };

      this.keyDownHandlers = R.compose(
        R.map(fn => fn.bind(this)),
        R.merge(commonKeyDownHandlers),
        R.propOr({}, 'keyDownHandlers')
      )(widgetProps);

      this.onChange = this.onChange.bind(this);
      this.onFocus = this.onFocus.bind(this);
      this.onBlur = this.onBlur.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
    }
    componentWillUnmount() {
      this.commit();
    }

    onFocus() {
      this.props.onFocusChanged();
    }
    onBlur() {
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

    isDisabled() {
      return (this.props.kind === NODE_PROPERTY_KIND.PIN) && !this.props.injected;
    }

    updateValue(value) {
      const newValue = this.maskValue(value);
      const commitCallback = (this.commitOnChange) ? this.commit.bind(this) : noop;

      this.setState({
        value: newValue,
      }, commitCallback);
    }

    commit() {
      const parsedValue = this.parseValue(this.state.value);
      if (parsedValue !== this.parseValue(this.props.value)) {
        this.props.onPropUpdate(
          this.props.entityId,
          this.props.kind,
          this.props.keyName,
          parsedValue
        );
      }
    }

    maskValue(val) {
      return PROPERTY_TYPE_MASK[this.type](val);
    }

    parseValue(val) {
      return PROPERTY_TYPE_PARSE[this.type](val);
    }

    render() {
      const elementId = `widget_${this.props.keyName}`;
      return (
        <div className="InspectorWidget">
          <Component
            elementId={elementId}
            label={this.props.label}
            value={this.state.value}
            disabled={this.isDisabled()}
            focused={this.props.focused && !this.isDisabled()}
            onBlur={this.onBlur}
            onFocus={this.onFocus}
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
          />
        </div>
      );
    }
  }

  Widget.propTypes = {
    entityId: React.PropTypes.string.isRequired,
    keyName: React.PropTypes.string.isRequired, // one of NODE_PROPERTY_KEY or pin key
    kind: React.PropTypes.string,
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
