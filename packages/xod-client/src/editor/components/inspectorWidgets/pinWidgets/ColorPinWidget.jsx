import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { throttle } from 'throttle-debounce';

import { showColorPickerWidget, tweakNodeProperty } from '../../../actions';
import PinWidget from './PinWidget';
import { hex2color } from '../../ColorPicker';
import ColorPickerWidget from '../../../containers/ColorPickerWidget';
import { isSessionActive } from '../../../../debugger/selectors';

class ColorPinWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      focused: false,
      selection: [0, 0],
    };
    this.inputRef = null;

    this.onValueTweaked = throttle(50, this.onValueTweaked.bind(this));

    this.onChangeHandler = this.onChangeHandler.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onWidgetChange = this.onWidgetChange.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.selection !== this.state.selection && this.inputRef) {
      this.inputRef.setSelectionRange(
        this.state.selection[0],
        this.state.selection[1]
      );
    }
  }

  onValueTweaked(value) {
    const { entityId, kind, keyName, tweakColor } = this.props;
    return tweakColor(entityId, kind, keyName, value);
  }
  onChangeHandler(value) {
    this.setState({ value });
    this.props.onChange(value);
    if (this.props.isActiveSession) {
      this.onValueTweaked(value);
    }
  }
  onInputChange(event) {
    this.onChangeHandler(event.target.value);
  }
  onWidgetChange(color) {
    this.onChangeHandler(color.hex);
  }
  onFocus(event) {
    this.setState({
      focused: true,
      selection: [event.target.selectionStart, event.target.selectionEnd],
    });
  }
  onBlur() {
    this.setState({
      focused: false,
      selection: [0, 0],
    });
    this.props.onBlur();
  }

  render() {
    return (
      <PinWidget
        elementId={this.props.elementId}
        label={this.props.label}
        dataType={this.props.dataType}
        isConnected={this.props.isConnected}
        isInvalid={this.props.isInvalid}
        deducedType={this.props.deducedType}
        isLastVariadicGroup={this.props.isLastVariadicGroup}
        isBindable={this.props.isBindable}
        direction={this.props.direction}
      >
        <span className="inspector-input-wrapper">
          <input
            className="inspectorTextInput"
            type="text"
            id={this.props.elementId}
            value={this.props.value}
            onChange={this.onInputChange}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            onKeyDown={this.props.onKeyDown}
            spellCheck={false}
            ref={el => {
              this.inputRef = el;
            }}
          />
          <button
            className="ColorPicker_toggleBtn"
            style={{ background: this.props.value }}
            onClick={() =>
              this.props.showColorPickerWidget(`#${this.inputRef.id}`)
            }
          />
        </span>
        <ColorPickerWidget
          color={hex2color(this.props.value)}
          onChange={this.onWidgetChange}
        />
      </PinWidget>
    );
  }
}

ColorPinWidget.propTypes = {
  entityId: PropTypes.string.isRequired,
  keyName: PropTypes.string.isRequired,
  kind: PropTypes.string.isRequired,
  elementId: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isInvalid: PropTypes.bool,
  isLastVariadicGroup: PropTypes.bool,
  isBindable: PropTypes.bool,
  deducedType: PropTypes.object,
  direction: PropTypes.string,
  isActiveSession: PropTypes.bool,

  value: PropTypes.string,
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  showColorPickerWidget: PropTypes.func.isRequired,
  tweakColor: PropTypes.func.isRequired,
};

ColorPinWidget.defaultProps = {
  label: 'Unnamed property',
  value: '',
  disabled: false,
};

export default connect(
  R.applySpec({
    isActiveSession: isSessionActive,
  }),
  dispatch =>
    bindActionCreators(
      {
        showColorPickerWidget,
        tweakColor: tweakNodeProperty,
      },
      dispatch
    )
)(ColorPinWidget);
