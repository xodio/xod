import React from 'react';
import PropTypes from 'prop-types';

const SystemMessage = props => (
  <div className={`line ${props.data.type}`}>
    <span className="prefix">&middot;&nbsp;</span>
    <span className="prefix">{props.data.message}</span>
  </div>
);

SystemMessage.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
  }),
};

export default SystemMessage;
