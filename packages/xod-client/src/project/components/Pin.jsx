import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { PIN_RADIUS, PIN_RADIUS_WITH_OUTER_STROKE, PIN_HIGHLIGHT_RADIUS } from '../nodeLayout';

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

  const variadicDots = props.isLastVariadicGroup
    ? (
      <text
        className="PinDots"
        x={props.position.x}
        y={props.position.y}
        textAnchor="middle"
        dy="1" // To center dots inside circle
      >
        &hellip;
      </text>
    )
    : null;

  return (
    <g
      className={cls}
      title={props.label}
      id={props.keyName}
    >
      <circle
        className="linkingHighlight"
        {...pinCircleCenter}
        r={PIN_HIGHLIGHT_RADIUS}
      />
      <circle
        className="outerStroke"
        {...pinCircleCenter}
        r={PIN_RADIUS_WITH_OUTER_STROKE}
      />
      <circle
        className={symbolClassNames}
        {...pinCircleCenter}
        r={PIN_RADIUS}
      />
      {variadicDots}
    </g>
  );
};

Pin.propTypes = {
  keyName: PropTypes.string.isRequired,
  label: PropTypes.string,
  type: PropTypes.string,
  position: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  isConnected: PropTypes.bool,
  isAcceptingLinks: PropTypes.bool,
  isLastVariadicGroup: PropTypes.bool,
};

export default Pin;
