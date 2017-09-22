import React from 'react';
import PropTypes from 'prop-types';

const ErrorMessage = props => (
  <div className={`line ${props.data.type}`}>
    <span className="content">{props.data.message}</span>
    <pre>
      {props.data.stack}
    </pre>
  </div>
);

ErrorMessage.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
    stack: PropTypes.string,
  }),
};

export default ErrorMessage;
