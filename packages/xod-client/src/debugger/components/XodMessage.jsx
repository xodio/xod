import React from 'react';
import PropTypes from 'prop-types';

const XodMessage = props => (
  <div className={`line ${props.data.type}`}>
    <span className="prefix">{props.data.prefix}</span>
    :
    <span className="timestamp">{props.data.timecode}</span>
    :
    <a className="nodeId">{props.data.nodeId}</a>
    :
    <span className="content">{props.data.content}</span>
  </div>
);

XodMessage.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.string,
    prefix: PropTypes.string,
    timecode: PropTypes.string,
    nodeId: PropTypes.string,
    content: PropTypes.string,
  }),
};

export default XodMessage;
