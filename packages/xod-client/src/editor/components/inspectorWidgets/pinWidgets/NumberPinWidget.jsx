import R from 'ramda';
import React from 'react';

import PinWidget from './PinWidget';

const NumberWidget = (props) => {
  const onChange = R.compose(
    props.onChange,
    R.when(
      isNaN,
      R.always(0)
    ),
    parseFloat,
    R.path(['target', 'value'])
  );

  return (
    <PinWidget {...props}>
      <input
        className="inspectorTextInput inspectorTextInput--number"
        type="text"
        id={props.elementId}
        value={props.value}

        onChange={onChange}
        onBlur={props.onBlur}
        onKeyDown={props.onKeyDown}
      />
    </PinWidget>
  );
};

NumberWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  value: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
  ]),
  onBlur: React.PropTypes.func.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onKeyDown: React.PropTypes.func.isRequired,
};

NumberWidget.defaultProps = {
  label: 'Unnamed property',
  value: 0,
};

export default NumberWidget;
