import React from 'react';
import PropTypes from 'prop-types';

const LabelWidget = (props) => {
  const onChange = (event) => {
    props.onChange(event.target.value);
  };
  return (
    <div className="Widget LabelWidget">
      <input
        className="inspectorTextInput nodeLabelTextInput"
        type="text"
        id={props.elementId}
        value={props.value}
        onChange={onChange}
        onBlur={props.onBlur}
        onKeyDown={props.onKeyDown}
        title={props.title}
      />
    </div>
  );
};

LabelWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  value: PropTypes.string,
  title: PropTypes.string,
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
};

LabelWidget.defaultProps = {
  value: '',
  title: '',
};

export default LabelWidget;
