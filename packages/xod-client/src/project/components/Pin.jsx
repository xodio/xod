import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { PIN_RADIUS, PIN_HIGHLIGHT_RADIUS } from '../nodeLayout';

const Pin = (props) => {
  const cls = classNames('Pin', {
    'is-selected': props.isSelected,
    'is-accepting-links': props.isAcceptingLinks,
  });

  const symbolClassNames = classNames(
    'symbol', props.type,
    { 'is-connected': props.isConnected }
  );

  const pinCircleCenter = {
    cx: props.position.x,
    cy: props.position.y,
  };

  return (
    <g
      className={cls}
      id={props.keyName}
    >
      <circle
        className="linkingHighlight"
        {...pinCircleCenter}
        r={PIN_HIGHLIGHT_RADIUS}
      />
      <circle
        className={symbolClassNames}
        {...pinCircleCenter}
        r={PIN_RADIUS}
      />
    </g>
  );
};

Pin.propTypes = {
  keyName: PropTypes.string.isRequired,
  type: PropTypes.string,
  position: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  isConnected: PropTypes.bool,
  isAcceptingLinks: PropTypes.bool,
};

export default Pin;
