import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import { KEYCODE } from '../../../utils/constants';
import { noop } from '../../../utils/ramda';
import { PROPERTY_TYPE_PARSE } from 'xod-core';

class StringWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      initialValue: props.value,
      value: props.value,
    };

    this.onChange = this.onChange.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  onChange(event) {
    const newValue = this.parseVal(event.target.value);
    this.setState(
      R.assoc('value', newValue, this.state)
    );
  }

  onBlur() {
    if (this.state.value !== this.props.value) {
      this.props.onPropUpdate(this.state.value);
    }
  }

  onKeyDown(event) {
    const keycode = event.keycode || event.which;
    if (keycode === KEYCODE.ENTER) {
      event.target.blur();
    }
    if (keycode === KEYCODE.ESCAPE) {
      this.setState(
        R.assoc('value', this.state.initialValue, this.state)
      );
    }
  }

  parseVal(val) {
    return PROPERTY_TYPE_PARSE.string(val);
  }

  render() {
    const elementId = `widget_${this.props.keyName}`;
    const val = this.state.value;

    const cls = classNames('StringWidget', {
      'is-disabled': this.props.disabled,
    });

    return (
      <div className={cls}>
        <input
          id={elementId}
          type="text"
          value={val}
          disabled={this.props.disabled}
          onChange={this.onChange}
          onBlur={this.onBlur}
          onKeyDown={this.onKeyDown}
        />
        <label
          htmlFor={elementId}
        >
          {this.props.label}
        </label>
      </div>
    );
  }
}

StringWidget.propTypes = {
  nodeId: React.PropTypes.number,
  keyName: React.PropTypes.string,
  disabled: React.PropTypes.bool,
  label: React.PropTypes.string,
  value: React.PropTypes.string,
  onPropUpdate: React.PropTypes.func,
};

StringWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
  disabled: false,
  onPropUpdate: noop,
};

export default StringWidget;
