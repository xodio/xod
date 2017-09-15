import React from 'react';
import PropTypes from 'prop-types';

const LogMessage = props => (
  <div className={`line ${props.data.type}`}>
    <span className="content">{props.data.message}</span>
  </div>
);

LogMessage.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
  }),
};

export default LogMessage;
