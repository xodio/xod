import React from 'react';

function HintWidget({ text }) {
  return (
    <div className="HintWidget">
      <span>{text}</span>
    </div>
  );
}

HintWidget.propTypes = {
  text: React.PropTypes.string,
};

export default HintWidget;
