import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { compose, withState, withHandlers, lifecycle } from 'recompose';
import { debounce } from 'throttle-debounce';

import { showColorPickerWidget, tweakNodeProperty } from '../../../actions';
import PinWidget from './PinWidget';
import { hex2color } from '../../ColorPicker';
import ColorPickerWidget from '../../../containers/ColorPickerWidget';
import { isSessionActive } from '../../../../debugger/selectors';

const ColorPinWidget = compose(
  withState('value', 'setValue', props => props.value),
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
    commit: ({ onChange }) => debounce(200, value => onChange(value)),
  }),
  withHandlers({
    onChangeHandler: ({
      entityId,
      kind,
      keyName,
      isActiveSession,
      tweakColor,
      setValue,
      commit,
    }) => value => {
      setValue(value);
      commit(value);
      if (isActiveSession) {
        tweakColor(entityId, kind, keyName, value);
      }
    },
  }),
  withHandlers({
    onInputChange: ({ onChangeHandler }) => event =>
      onChangeHandler(event.target.value),
    onWidgetChange: ({ onChangeHandler }) => color =>
      onChangeHandler(color.hex),
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
        onChange={props.onInputChange}
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
      onChange={props.onWidgetChange}
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
