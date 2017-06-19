import React from 'react';
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
  keyName: React.PropTypes.string.isRequired,
  type: React.PropTypes.string,
  position: React.PropTypes.object.isRequired,
  isSelected: React.PropTypes.bool,
  isConnected: React.PropTypes.bool,
  isAcceptingLinks: React.PropTypes.bool,
};

export default Pin;
