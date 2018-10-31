import React from 'react';
import PropTypes from 'prop-types';
import { enquote, unquote } from 'xod-func-tools';
import { withState } from 'recompose';
import cls from 'classnames';

import PinWidget from './PinWidget';

const StringWidget = withState('focused', 'setFocus', false)(props => {
  const onChange = event => props.onChange(enquote(event.target.value));
  const onFocus = () => props.setFocus(true);
  const onBlur = () => {
    props.setFocus(false);
    props.onBlur();
  };

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
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={props.onKeyDown}
          spellCheck={false}
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
  /* eslint-disable react/no-unused-prop-types */
  // Linter can't find out usage of this functions somehow :-(
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  /* eslint-enable react/no-unused-prop-types */
  onKeyDown: PropTypes.func.isRequired,
};

StringWidget.defaultProps = {
  label: 'Unnamed property',
  value: '',
  disabled: false,
};

export default StringWidget;
