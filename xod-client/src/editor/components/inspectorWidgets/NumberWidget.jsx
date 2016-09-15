import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import { KEYCODE } from 'xod-client/utils/constants';
import Switch from '../InspectorModeSwitch';

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
    this.props.onPropUpdate(newValue);
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
    const lastChar = (isForInput && val[val.length - 1] === '.') ? '.' : null;
    const newValue = parseFloat(val) + lastChar;
    return isNaN(newValue) ? '' : newValue;
  }

  render() {
    const elementId = `widget_${this.props.keyName}`;
    const val = this.state.value;

    const cls = classNames('NumberWidget', {
      'is-disabled': this.props.disabled,
    });

    const onSwitch = (val) => { console.log('!!!', val); };
    const SwitchComp = (this.props.modes === 'both') ?
      <Switch mode={this.props.mode} onSwitch={onSwitch} /> :
      null;

    return (
      <div className={cls}>
        {SwitchComp}
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
  value: false,
  disabled: false,
  onPropUpdate: f => f,
};

export default NumberWidget;
