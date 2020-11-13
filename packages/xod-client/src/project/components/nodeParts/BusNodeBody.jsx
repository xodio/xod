import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as XP from 'xod-project';

import { getRenderablePinType } from '../../utils';
import NodeLabel from './NodeLabel';

const labelHeight = 24;
const scale = 0.8; // of a triangle

const polygonPointsGetters = {
  [XP.TO_BUS_PATH]: ({ width }) => `
    ${width - width * scale} ${labelHeight}
    ${width * scale} ${labelHeight}
    ${width * 0.5} ${labelHeight + width * ((1 - scale) * 2)}
  `,
  [XP.FROM_BUS_PATH]: ({ width, height }) => `
    ${width - width * scale} ${height - labelHeight}
    ${width * scale} ${height - labelHeight}
    ${width * 0.5} ${height - labelHeight - width * ((1 - scale) * 2)}
  `,
};

const linePropsGetters = {
  [XP.TO_BUS_PATH]: ({ width }) => ({
    x1: width * 0.5,
    x2: width * 0.5,
    y1: 0,
    y2: labelHeight,
  }),
  [XP.FROM_BUS_PATH]: ({ width, height }) => ({
    x1: width * 0.5,
    x2: width * 0.5,
    y1: height - labelHeight,
    y2: height,
  }),
};

const getLabelOffsets = ({ height }) => ({
  [XP.TO_BUS_PATH]: height - labelHeight - 1,
  [XP.FROM_BUS_PATH]: 0,
});

const BusNodeBody = ({ type, pxSize, pins, label }) => {
  const polygonProps = {
    points: polygonPointsGetters[type](pxSize),
    strokeLinejoin: 'round',
  };

  const dataType = R.compose(
    getRenderablePinType,
    R.head, // bus nodes have exactly one pin
    R.values
  )(pins);

  const lineProps = linePropsGetters[type](pxSize);

  return (
    <g className="bus-node">
      <rect
        className="clickable-area"
        width={pxSize.width}
        height={pxSize.height}
        x={0}
        y={0}
      />
      <line className={classNames('outline', dataType)} {...lineProps} />
      <polygon className="body" {...polygonProps} />
      <NodeLabel
        text={label}
        width={pxSize.width}
        height={labelHeight}
        y={getLabelOffsets(pxSize)[type]}
      />
      <polygon {...polygonProps} className={classNames('outline', dataType)} />
    </g>
  );
};

BusNodeBody.propTypes = {
  pins: PropTypes.any.isRequired,
  type: PropTypes.string,
  label: PropTypes.string,
  /* eslint-disable react/no-unused-prop-types */
  pxSize: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  /* eslint-enable react/no-unused-prop-types */
};

export default BusNodeBody;
