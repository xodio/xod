import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { noop } from 'xod-func-tools';

import { KEYCODE } from '../../../utils/constants';
import deepSCU from '../../../utils/deepSCU';

const commonKeyDownHandlers = {
  [KEYCODE.ESCAPE]: function escape(event) {
    if (this.state.value === this.props.value) {
      event.target.blur();
    } else {
      this.updateValue(this.props.value);
    }
  },
};

class Widget extends React.Component {
  constructor(props) {
    super(props);

    const { value, keyDownHandlers } = props;

    this.state = {
      value,
    };

    // Store latest commited value (or parsed value)
    // to avoid double dispatching of updating property
    this.lastCommitedValue = value;

    this.keyDownHandlers = R.compose(
      R.map(fn => fn.bind(this)),
      R.merge(commonKeyDownHandlers)
    )(keyDownHandlers);

    this.onChange = this.onChange.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.shouldComponentUpdate = deepSCU.bind(this);
  }

  componentWillUnmount() {
    this.commit();
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

  updateValue(value, forceCommit = false) {
    const commitCallback =
      this.props.commitOnChange || forceCommit ? this.commit.bind(this) : noop;

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

    const parsedValue = this.props.normalizeValue(this.state.value);

    // To show a "canonical" form of a value after commiting
    // (`13` -> `D13` in Port input)
    // Or to reset invalid data to a default
    // (`blabla` -> `0` in Number input)
    this.setState({ value: parsedValue });

    // Prevent of commiting value twice on blur and on unmnount in widgets
    // that have a differences in `state.value` and `parsedValue`.
    // E.G.
    // Strings are represented in the inputs just as string 'hello'
    // But parsed value will be '"hello"'.
    if (parsedValue === this.lastCommitedValue) {
      return;
    }

    // Store last commited value to avoid commiting the same value twice.
    this.lastCommitedValue = parsedValue;

    this.props.onPropUpdate(
      this.props.entityId,
      this.props.kind,
      this.props.keyName,
      parsedValue
    );
  }

  render() {
    const Component = this.props.component;

    const restProps = R.omit(
      [
        'children',
        'component',
        'onPropUpdate',
        'normalizeValue',
        'commitOnChange',
        'keyDownHandlers',
      ],
      this.props
    );

    return (
      <div className="InspectorWidget">
        <Component
          {...restProps}
          elementId={`widget_${this.props.keyName}`}
          value={this.state.value}
          onBlur={this.onBlur}
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
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.array,
  ]),
  component: PropTypes.func.isRequired, // a `class` which we're making to extend React.Component is also a function
  keyDownHandlers: PropTypes.objectOf(PropTypes.func),
  commitOnChange: PropTypes.bool,
  normalizeValue: PropTypes.func,
  // dispatchers
  onPropUpdate: PropTypes.func.isRequired,
};

Widget.defaultProps = {
  className: '',
  value: '',
  isConnected: false,
  keyDownHandlers: {},
  normalizeValue: R.identity,
  onPropUpdate: noop,
  onPinModeSwitch: noop,
};

export default Widget;
