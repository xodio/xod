import React from 'react';

function HintWidget({ text }) {
  return (
    <div className="inspector__hintWidget">
      <small>{text}</small>
    </div>
  );
}

HintWidget.propTypes = {
  text: React.PropTypes.string,
};

export default HintWidget;
