import React from 'react';


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
        value={props.value}
        onChange={onChange}
        onBlur={props.onBlur}
        onKeyDown={props.onKeyDown}
      />
    </div>
  );
};

DescriptionWidget.propTypes = {
  elementId: React.PropTypes.string.isRequired,
  value: React.PropTypes.string,
  onBlur: React.PropTypes.func.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onKeyDown: React.PropTypes.func.isRequired,
};

DescriptionWidget.defaultProps = {
  value: '',
};

export default DescriptionWidget;
