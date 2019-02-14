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
      {isGenericType(props.type) ? (
        <circle className="generic-pin-marker" {...pinCircleCenter} r={1} />
      ) : null}
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
