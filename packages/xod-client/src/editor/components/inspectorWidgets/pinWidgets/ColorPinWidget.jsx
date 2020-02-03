import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { compose, withState, withHandlers, lifecycle } from 'recompose';

import { showColorPickerWidget } from '../../../actions';
import PinWidget from './PinWidget';
import { hex2color } from '../../ColorPicker';
import ColorPickerWidget from '../../../containers/ColorPickerWidget';

const ColorPinWidget = compose(
  withState('focused', 'setFocus', false),
  // We have to handle input's selection in a tricky way,
  // because we're changing it's value on focus
  withState('selection', 'setSelection', [0, 0]),
  withState('inputRef', 'setInputRef', null),
  // We have to handle it in case we just added a leading quote
  // before the literal
  lifecycle({
    componentDidUpdate(prevProps) {
      if (prevProps.selection !== this.props.selection && this.props.inputRef) {
        this.props.inputRef.setSelectionRange(
          this.props.selection[0],
          this.props.selection[1]
        );
      }
    },
  }),
  withHandlers({
    onChangeHandler: props => event => {
      const value = event.target.value;
      props.onChange(value);
    },
    onFocus: props => event => {
      props.setSelection([
        event.target.selectionStart,
        event.target.selectionEnd,
      ]);
      props.setFocus(true);
    },
    onBlur: props => _ => {
      props.setFocus(false);
      props.setSelection([0, 0]);
      props.onBlur();
    },
  })
)(props => (
  <PinWidget
    elementId={props.elementId}
    label={props.label}
    dataType={props.dataType}
    isConnected={props.isConnected}
    isInvalid={props.isInvalid}
    deducedType={props.deducedType}
    isLastVariadicGroup={props.isLastVariadicGroup}
    isBindable={props.isBindable}
    direction={props.direction}
  >
    <span className="inspector-input-wrapper">
      <input
        className="inspectorTextInput"
        type="text"
        id={props.elementId}
        value={props.value}
        onChange={props.onChangeHandler}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onKeyDown={props.onKeyDown}
        spellCheck={false}
        ref={props.setInputRef}
      />
      <button
        className="ClorPicker_toggleBtn"
        style={{ background: props.value }}
        onClick={() => props.showColorPickerWidget(`#${props.inputRef.id}`)}
      />
    </span>
    <ColorPickerWidget
      color={hex2color(props.value)}
      onChange={color => props.onChange(color.hex, true)}
    />
  </PinWidget>
));

ColorPinWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isInvalid: PropTypes.bool,
  isLastVariadicGroup: PropTypes.bool,
  isBindable: PropTypes.bool,
  deducedType: PropTypes.object,
  direction: PropTypes.string,

  value: PropTypes.string,
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  showColorPickerWidget: PropTypes.func.isRequired,
};

ColorPinWidget.defaultProps = {
  label: 'Unnamed property',
  value: '',
  disabled: false,
};

export default connect(
  () => ({}),
  dispatch => bindActionCreators({ showColorPickerWidget }, dispatch)
)(ColorPinWidget);
