import React from 'react';
import PropTypes from 'prop-types';
import { enquote, unquote } from 'xod-func-tools';
import { compose, withState, withHandlers, lifecycle } from 'recompose';
import cls from 'classnames';

import PinWidget from './PinWidget';

const StringWidget = compose(
  withState('focused', 'setFocus', false),
  // We have to handle input's selection in a tricky way,
  // because we're changing it's value on focus
  withState('selection', 'setSelection', [0, 0]),
  withState('inputRef', 'setInputRef', null),
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
    onChange: props => event => props.onChange(enquote(event.target.value)),
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
  const wrapperClassNames = cls('inspector-input-wrapper', {
    'string-focused': props.focused,
  });
  const value = props.focused ? unquote(props.value) : props.value;

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
          onChange={props.onChange}
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
