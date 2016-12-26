import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import { KEYCODE } from '../../../utils/constants';
import { noop } from '../../../utils/ramda';
import { PROPERTY_TYPE_PARSE } from 'xod-core';


class NumberWidget extends React.Component {
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
    const newValue = this.parseVal(event.target.value, true);
    this.updateValue(newValue);
  }

  onBlur() {
    const newValue = this.parseVal(this.state.value);
    this.updateValue(newValue);
    if (newValue !== this.props.value) {
      this.props.onPropUpdate(newValue);
    }
  }

  onKeyDown(event) {
    const keycode = event.keycode || event.which;
    const input = event.target;

    if (keycode === KEYCODE.DOT || keycode === KEYCODE.COMMA) {
      event.preventDefault();
      this.updateValue(`${input.value}.`);
    }
    if (keycode === KEYCODE.UP) {
      event.preventDefault();
      this.updateValue(this.parseVal(input.value) + 1);
    }
    if (keycode === KEYCODE.DOWN) {
      event.preventDefault();
      this.updateValue(this.parseVal(input.value) - 1);
    }
    if (keycode === KEYCODE.ENTER) {
      input.blur();
    }
    if (keycode === KEYCODE.ESCAPE) {
      if (this.state.value === this.state.initialValue) {
        input.blur();
      } else {
        this.updateValue(this.state.initialValue);
      }
    }
  }

  updateValue(newValue) {
    this.setState(
      R.assoc('value', newValue, this.state)
    );
  }

  parseVal(val, isForInput = false) {
    return PROPERTY_TYPE_PARSE.number(val, isForInput);
  }

  render() {
    const elementId = `widget_${this.props.keyName}`;
    const val = this.state.value;

    const cls = classNames('NumberWidget', {
      'is-disabled': this.props.disabled,
    });

    return (
      <div className={cls}>
        <input
          id={elementId}
          type="text"
          step="any"
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

NumberWidget.propTypes = {
  nodeId: React.PropTypes.number,
  keyName: React.PropTypes.string,
  modes: React.PropTypes.string,
  mode: React.PropTypes.string,
  label: React.PropTypes.string,
  value: React.PropTypes.number,
  disabled: React.PropTypes.bool,
  onPropUpdate: React.PropTypes.func,
};

NumberWidget.defaultProps = {
  label: 'Unnamed property',
  disabled: false,
  onPropUpdate: noop,
};

export default NumberWidget;
