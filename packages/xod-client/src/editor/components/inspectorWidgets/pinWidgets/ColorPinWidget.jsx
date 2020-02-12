import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { throttle } from 'throttle-debounce';

import {
  showColorPickerWidget,
  hideColorPickerWidget,
  tweakNodeProperty,
} from '../../../actions';
import PinWidget from './PinWidget';
import { hex2color } from '../../ColorPicker';
import ColorPickerWidget from '../ColorPickerWidget';
import { isSessionActive } from '../../../../debugger/selectors';
import { getVisibleColorPickerWidgetId } from '../../../selectors';

class ColorPinWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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

    this.showColorPickerWidget = this.showColorPickerWidget.bind(this);
    this.hideColorPickerWidget = this.hideColorPickerWidget.bind(this);
    this.storeInputRef = this.storeInputRef.bind(this);
  }

  onValueTweaked(value) {
    const { entityId, kind, keyName, tweakColor } = this.props;
    return tweakColor(entityId, kind, keyName, value);
  }
  onChangeHandler(value) {
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

  showColorPickerWidget() {
    this.props.showColorPickerWidget(this.props.elementId);
  }
  hideColorPickerWidget() {
    this.props.hideColorPickerWidget();
  }

  storeInputRef(el) {
    this.inputRef = el;
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
            ref={this.storeInputRef}
          />
          <button
            className="ColorPicker_toggleBtn"
            style={{ background: this.props.value }}
            onClick={this.showColorPickerWidget}
          />
        </span>
        <ColorPickerWidget
          widgetId={this.props.elementId}
          isVisible={
            this.props.visibleColorPickerWidgetId === this.props.elementId
          }
          color={hex2color(this.props.value)}
          onChange={this.onWidgetChange}
          onClose={this.hideColorPickerWidget}
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
  visibleColorPickerWidgetId: PropTypes.string,

  value: PropTypes.string,
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  showColorPickerWidget: PropTypes.func.isRequired,
  hideColorPickerWidget: PropTypes.func.isRequired,
  tweakColor: PropTypes.func.isRequired,
};

ColorPinWidget.defaultProps = {
  label: 'Unnamed property',
  value: '',
  disabled: false,
  visibleColorPickerWidgetId: null,
};

export default connect(
  R.applySpec({
    isActiveSession: isSessionActive,
    visibleColorPickerWidgetId: getVisibleColorPickerWidgetId,
  }),
  dispatch =>
    bindActionCreators(
      {
        showColorPickerWidget,
        hideColorPickerWidget,
        tweakColor: tweakNodeProperty,
      },
      dispatch
    )
)(ColorPinWidget);
