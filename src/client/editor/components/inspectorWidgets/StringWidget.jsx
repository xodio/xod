import R from 'ramda';
import React from 'react';
import { ENTER, ESCAPE } from 'xod/client/constants/keycodes';

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
    return String(val);
  }

  render() {
    const elementId = `widget_${this.props.nodeId}_${this.props.key}`;
    const val = this.state.value;

    return (
      <div className="StringWidget">
        <input
          id={elementId}
          type="text"
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

StringWidget.propTypes = {
  nodeId: React.PropTypes.number,
  key: React.PropTypes.string,
  label: React.PropTypes.string,
  value: React.PropTypes.string,
  onPropUpdate: React.PropTypes.func,
};

StringWidget.defaultProps = {
  label: 'Unnamed property',
  value: false,
  onPropUpdate: f => f,
};

export default StringWidget;
