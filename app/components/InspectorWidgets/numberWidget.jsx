import R from 'ramda';
import React from 'react';
import { ENTER, ESCAPE } from '../../constants/keycodes';

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
    const newValue = this.parseVal(event.target.value);
    this.setState(
      R.assoc('value', newValue, this.state)
    );
  }
  onBlur() {
    this.props.onPropUpdate(this.state.value);
  }
  onKeyDown(event) {
    const keycode = event.keycode || event.which;
    if (keycode === ENTER) {
      event.target.blur();
    }
    if (keycode === ESCAPE) {
      this.setState(
        R.assoc('value', this.state.initialValue, this.state)
      );
    }
  }

  parseVal(val) {
    return parseInt(val, 10);
  }

  render() {
    const elementId = `widget_${this.props.nodeId}_${this.props.key}`;
    const val = this.state.value;

    return (
      <div className="NumberWidget">
        <input
          id={elementId}
          type="number"
          value={val}
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
  key: React.PropTypes.string,
  label: React.PropTypes.string,
  value: React.PropTypes.number,
  onPropUpdate: React.PropTypes.func,
};

NumberWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
  onPropUpdate: f => f,
};

export default NumberWidget;
