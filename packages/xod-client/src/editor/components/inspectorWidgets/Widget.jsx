import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { ensureLiteral } from 'xod-project';
import { PROPERTY_TYPE_PARSE } from '../../../utils/inputFormatting';

import { KEYCODE } from '../../../utils/constants';
import { noop } from '../../../utils/ramda';
import deepSCU from '../../../utils/deepSCU';
import { NODE_PROPERTY_KIND } from '../../../project/constants';

export default function composeWidget(Component, widgetProps) {
  const commonKeyDownHandlers = {
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

      // Store latest commited value (or parsed value)
      // to avoid double dispatching of updating property
      this.lastCommitedValue = val;

      this.keyDownHandlers = R.compose(
        R.map(fn => fn.bind(this)),
        R.merge(commonKeyDownHandlers),
        R.propOr({}, 'keyDownHandlers')
      )(widgetProps);

      this.parseValue = this.parseValue.bind(this);

      this.onChange = this.onChange.bind(this);
      this.onFocus = this.onFocus.bind(this);
      this.onBlur = this.onBlur.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);

      this.shouldComponentUpdate = deepSCU.bind(this);
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
      return (
        this.props.kind === NODE_PROPERTY_KIND.PIN && this.props.isConnected
      );
    }

    updateValue(value) {
      const commitCallback = this.commitOnChange
        ? this.commit.bind(this)
        : noop;

      this.setState({ value }, commitCallback);
    }

    commit() {
      // Prevent of commiting widgets without changes provided by User
      // E.G.
      // User changed one of few widgets, but all of them will be
      // unmnounted, so they try to commit values. Commit function parses
      // and converts value into literal, so it could differ from initial value.
      // This check will avoid unwanted commits.
      if (this.state.value === this.lastCommitedValue) return;

      const parsedValue = R.pipe(this.parseValue, ensureLiteral(this.type))(
        this.state.value
      );

      // Prevent of commiting value twice on blur and on unmnount in widgets
      // that have a differences in `state.value` and `parsedValue`.
      // E.G.
      // Strings are represented in the inputs just as string 'hello'
      // But parsed value will be '"hello"'.
      if (parsedValue === this.lastCommitedValue) return;

      // Store last commited value to avoid commiting the same value twice.
      this.lastCommitedValue = parsedValue;

      this.props.onPropUpdate(
        this.props.entityId,
        this.props.kind,
        this.props.keyName,
        parsedValue
      );
    }

    parseValue(val) {
      const parser = PROPERTY_TYPE_PARSE[this.type] || R.identity;
      return parser(val);
    }

    render() {
      const elementId = `widget_${this.props.keyName}`;
      return (
        <div className="InspectorWidget">
          <Component
            elementId={elementId}
            label={this.props.label}
            title={this.props.title}
            normalizedLabel={this.props.normalizedLabel}
            isConnected={this.props.isConnected}
            isLastVariadicGroup={this.props.isLastVariadicGroup}
            isBindable={this.props.isBindable}
            direction={this.props.direction}
            dataType={this.type}
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
    entityId: PropTypes.string.isRequired,
    keyName: PropTypes.string.isRequired, // one of NODE_PROPERTY_KEY or pin key
    kind: PropTypes.string,
    label: PropTypes.string,
    title: PropTypes.string,
    normalizedLabel: PropTypes.string,
    direction: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
      PropTypes.array,
    ]),
    isConnected: PropTypes.bool,
    isLastVariadicGroup: PropTypes.bool,
    isBindable: PropTypes.bool,
    focused: PropTypes.bool,
    // dispatchers
    onPropUpdate: PropTypes.func.isRequired,
    onFocusChanged: PropTypes.func,
  };

  Widget.defaultProps = {
    className: '',
    label: 'Unknown property',
    normalizedLabel: '',
    value: '',
    title: '',
    focused: false,
    isConnected: false,
    isLastVariadicGroup: false,
    isBindable: true,
    direction: '',
    onPropUpdate: noop,
    onPinModeSwitch: noop,
    onFocusChanged: noop,
  };

  return Widget;
}
