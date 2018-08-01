import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isGenericType, PIN_DIRECTION } from 'xod-project';

import { getRenderablePinType } from '../utils';

import {
  PIN_RADIUS,
  PIN_INNER_RADIUS,
  PIN_RADIUS_WITH_OUTER_STROKE,
  PIN_HIGHLIGHT_RADIUS,
} from '../nodeLayout';

/**
 * An outline of half of the circle, that indicated that Pin is generic
 * even it has a deduced type.
 */
// :: Number -> Number -> Boolean -> ReactElement
const genericPinMarker = (pinCircleCenter, output) => {
  // To avoid using complex paths we draw just a circle
  // but draw only half of the outline by CSS.

  // To do it with CSS we have to:
  //  1. Calculate the length of the circle (circumference).
  const circumference = Math.PI * PIN_RADIUS * 2;
  //  2. Calculate distance beetween dashes
  const dasharray = 0.5 * circumference;
  //  3. And then set `dasharray` to draw a half of outline
  //  4. And set `dashoffset` to draw another half (for output Pin)
  return (
    <circle
      className="generic-pin-marker"
      {...pinCircleCenter}
      r={PIN_RADIUS}
      style={{
        strokeDashoffset: output ? dasharray : 0,
        strokeDasharray: dasharray,
      }}
    />
  );
};

const Pin = props => {
  const isOutput = props.direction === PIN_DIRECTION.OUTPUT;

  const cls = classNames('Pin', {
    'is-selected': props.isSelected,
    'is-accepting-links': props.isAcceptingLinks,
    'is-connected': props.isConnected,
    'is-input': props.direction === PIN_DIRECTION.INPUT,
    'is-output': isOutput,
  });

  const renderableType = getRenderablePinType(props);

  const hasConflictingBoundValue =
    renderableType === 'conflicting' && !props.isConnected && !!props.value;

  const symbolClassNames = classNames('symbol', renderableType, {
    hasConflictingBoundValue,
    'is-connected': props.isConnected,
    'is-invalid': props.isInvalid,
  });

  const pinCircleCenter = {
    cx: props.position.x,
    cy: props.position.y,
  };

  const variadicDots = props.isLastVariadicGroup ? (
    <text
      className="PinDots"
      x={props.position.x}
      y={props.position.y}
      textAnchor="middle"
      dy="1" // To center dots inside circle
    >
      &hellip;
    </text>
  ) : null;

  return (
    <g className={cls} title={props.label} id={props.keyName}>
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
      {props.deducedType && props.isConnected ? (
        <circle
          className={classNames('symbol', 'is-connected', renderableType)}
          {...pinCircleCenter}
          r={PIN_INNER_RADIUS}
        />
      ) : null}
      {isGenericType(props.type)
        ? genericPinMarker(pinCircleCenter, isOutput)
        : null}
      {variadicDots}
    </g>
  );
};

Pin.propTypes = {
  keyName: PropTypes.string.isRequired,
  label: PropTypes.string,
  type: PropTypes.string,
  deducedType: PropTypes.object,
  value: PropTypes.any,
  direction: PropTypes.string,
  position: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  isConnected: PropTypes.bool,
  isInvalid: PropTypes.bool,
  isAcceptingLinks: PropTypes.bool,
  isLastVariadicGroup: PropTypes.bool,
};

export default Pin;
