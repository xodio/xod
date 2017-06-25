import React from 'react';
import PropTypes from 'prop-types';

const DescriptionWidget = (props) => {
  const onChange = (event) => {
    props.onChange(event.target.value);
  };
  return (
    <div className="Widget DescriptionWidget">
      <label htmlFor={props.elementId}>
        Description
      </label>
      <textarea
        className="inspectorTextInput"
        id={props.elementId}
        disabled={props.disabled}
        value={props.value}
        onChange={onChange}
        onBlur={props.onBlur}
        onKeyDown={props.onKeyDown}
      />
    </div>
  );
};

DescriptionWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  value: PropTypes.string,
  disabled: PropTypes.bool,
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
};

DescriptionWidget.defaultProps = {
  value: '',
  disabled: false,
};

export default DescriptionWidget;
