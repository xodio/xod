import React from 'react';


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
      />
    </div>
  );
};

LabelWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  value: React.PropTypes.string,
  onBlur: React.PropTypes.func.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onKeyDown: React.PropTypes.func.isRequired,
};

LabelWidget.defaultProps = {
  value: '',
};

export default LabelWidget;
