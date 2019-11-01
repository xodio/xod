import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { enquote, unquote } from 'xod-func-tools';
import { compose, withState, withHandlers, lifecycle } from 'recompose';
import cls from 'classnames';

import PinWidget from './PinWidget';

const isStringModeValue = R.startsWith('"');

const requote = R.pipe(unquote, enquote);

const StringWidget = compose(
  withState('focused', 'setFocus', false),
  // We have to handle input's selection in a tricky way,
  // because we're changing it's value on focus
  withState('selection', 'setSelection', [0, 0]),
  withState('inputRef', 'setInputRef', null),
  withState('isStringMode', 'setStringMode', props =>
    isStringModeValue(props.value)
  ),
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
      props.onChange(props.isStringMode ? enquote(value) : value);
    },
    onKeyDown: props => event => {
      if (
        event.target.selectionStart === 0 &&
        event.target.selectionEnd === 0
      ) {
        // Backspace
        // If it deletes a "virtual" quote — exit the string mode
        if (event.keyCode === 8 && props.isStringMode) {
          event.preventDefault();
          props.setStringMode(false);
          props.onChange(event.target.value);
          return;
        }
        // Quote
        // If it was not a string mode — enter it and do not place an extra quote
        // In other cases — it will place an extra quote
        if (event.keyCode === 222 && !props.isStringMode) {
          event.preventDefault();
          props.setStringMode(true);
          props.onChange(requote(event.target.value));
          return;
        }
      }

      props.onKeyDown(event);
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
)(props => {
  const showQuotes = props.focused && props.isStringMode;
  const wrapperClassNames = cls('inspector-input-wrapper', {
    'with-fake-quotes': showQuotes,
  });
  const value = showQuotes ? unquote(props.value) : props.value;

  return (
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
      <span className={wrapperClassNames}>
        <input
          className="inspectorTextInput"
          type="text"
          id={props.elementId}
          value={value}
          onChange={props.onChangeHandler}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          onKeyDown={props.onKeyDown}
          spellCheck={false}
          ref={props.setInputRef}
        />
      </span>
    </PinWidget>
  );
});

StringWidget.propTypes = {
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
};

StringWidget.defaultProps = {
  label: 'Unnamed property',
  value: '',
  disabled: false,
};

export default StringWidget;
