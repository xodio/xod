import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { foldEither } from 'xod-func-tools';
import { PIN_DIRECTION } from 'xod-project';

import {
  PIN_RADIUS,
  PIN_INNER_RADIUS,
  PIN_RADIUS_WITH_OUTER_STROKE,
  PIN_HIGHLIGHT_RADIUS,
} from '../nodeLayout';

const Pin = props => {
  const cls = classNames('Pin', {
    'is-selected': props.isSelected,
    'is-accepting-links': props.isAcceptingLinks,
    'is-connected': props.isConnected,
    'is-input': props.direction === PIN_DIRECTION.INPUT,
    'is-output': props.direction === PIN_DIRECTION.OUTPUT,
  });

  const symbolClassNames = classNames('symbol', props.type, {
    'is-connected': props.isConnected,
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
          className={classNames(
            'symbol',
            'is-connected',
            foldEither(R.always('conflicting'), R.identity, props.deducedType)
          )}
          {...pinCircleCenter}
          r={PIN_INNER_RADIUS}
        />
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
  direction: PropTypes.string,
  position: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  isConnected: PropTypes.bool,
  isAcceptingLinks: PropTypes.bool,
  isLastVariadicGroup: PropTypes.bool,
};

export default Pin;
