import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import { KEYCODE } from '../../../utils/constants';
import { noop } from '../../../utils/ramda';
import { PROPERTY_TYPE_PARSE } from 'xod-core';


class PulseWidget extends React.Component {
  constructor(props) {
    super(props);
    const val = this.parseVal(props.value);

    this.state = {
      initialValue: val,
      value: val,
    };

    this.onChange = this.onChange.bind(this);
    this.onSelectChange = this.onSelectChange.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  onChange() {
    this.parseAndUpdate();
  }

  onSelectChange() {
    this.onBlur();
  }

  onBlur() {
    const newValue = this.parseAndUpdate();
    if (newValue !== this.props.value) {
      this.props.onPropUpdate(newValue);
    }
  }

  onKeyDown(event) {
    const keycode = event.keycode || event.which;
    const input = event.target;
    const val = this.getValue();

    if (keycode === KEYCODE.DOT || keycode === KEYCODE.COMMA) {
      event.preventDefault();
      this.updateValue(
        this.parseVal([val.type, `${input.value}.`])
      );
    }
    if (keycode === KEYCODE.UP) {
      event.preventDefault();
      this.updateValue(
        this.parseVal([val.type, input.value + 1])
      );
    }
    if (keycode === KEYCODE.DOWN) {
      event.preventDefault();
      this.updateValue(
        this.parseVal([val.type, input.value - 1])
      );
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

  getValue() {
    const val = this.state.value.split(',');
    return {
      type: val[0], // once / every
      time: val[1], // seconds
    };
  }

  parseAndUpdate() {
    const selectValue = this.refs.select.value;
    const inputValue = this.refs.input.value;
    const newValue = this.parseVal([selectValue, inputValue]);
    this.updateValue(newValue);

    return newValue;
  }

  updateValue(newValue) {
    this.setState(
      R.assoc('value', newValue, this.state)
    );
  }

  parseVal(val) {
    return PROPERTY_TYPE_PARSE.pulse(val);
  }

  render() {
    const elementId = `widget_${this.props.keyName}`;
    const val = this.getValue();

    const cls = classNames('PulseWidget', {
      'is-disabled': this.props.disabled,
    });

    return (
      <div className={cls}>
        <input
          ref="input"
          type="text"
          value={val.time}
          disabled={this.props.disabled}
          onChange={this.onChange}
          onBlur={this.onBlur}
          onKeyDown={this.onKeyDown}
        />
        <select
          ref="select"
          id={elementId}
          value={val.type}
          disabled={this.props.disabled}
          onChange={this.onSelectChange}
        >
          <option value="once">Once</option>
          <option value="every">Every</option>
        </select>
        <label
          htmlFor={elementId}
        >
          {this.props.label}
        </label>
      </div>
    );
  }
}

PulseWidget.propTypes = {
  nodeId: React.PropTypes.number,
  keyName: React.PropTypes.string,
  modes: React.PropTypes.string,
  mode: React.PropTypes.string,
  label: React.PropTypes.string,
  value: React.PropTypes.any,
  disabled: React.PropTypes.bool,
  onPropUpdate: React.PropTypes.func,
};

PulseWidget.defaultProps = {
  value: '',
  label: 'Unnamed property',
  disabled: false,
  onPropUpdate: noop,
};

export default PulseWidget;
