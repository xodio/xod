import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import { KEYCODE } from '../../../utils/constants';
import { noop } from '../../../utils/ramda';
import { PROPERTY_TYPE_PARSE } from 'xod-core';

class IOLabelWidget extends React.Component {
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
    const val = event.target.value;
    if (!(/^([a-zA-Z0-9]){0,4}$/.test(val))) { return; }

    const newValue = this.parseVal(val);
    this.setState(
      R.assoc('value', newValue, this.state)
    );
  }

  onBlur() {
    this.props.onPropUpdate(this.state.value);
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

    const cls = classNames('IOLabelWidget', {
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

IOLabelWidget.propTypes = {
  nodeId: React.PropTypes.number,
  keyName: React.PropTypes.string,
  label: React.PropTypes.string,
  value: React.PropTypes.string,
  disabled: React.PropTypes.bool,
  onPropUpdate: React.PropTypes.func,
};

IOLabelWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
  disabled: false,
  onPropUpdate: noop,
};

export default IOLabelWidget;
