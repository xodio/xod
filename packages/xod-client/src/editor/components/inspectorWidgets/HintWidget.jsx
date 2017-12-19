import React from 'react';
import PropTypes from 'prop-types';

function HintWidget({ text }) {
  return (
    <div className="Widget HintWidget">
      <span>{text}</span>
    </div>
  );
}

HintWidget.propTypes = {
  text: PropTypes.string,
};

export default HintWidget;
