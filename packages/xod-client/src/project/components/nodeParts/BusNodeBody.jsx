import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as XP from 'xod-project';

import { getRenderablePinType } from '../../utils';
import NodeLabel from './NodeLabel';

const polygonPointsGetters = {
  [XP.TO_BUS_PATH]: ({ width }) => `
    0 0
    ${width} 0
    ${width * 0.5} ${width * 0.6}
  `,
  [XP.FROM_BUS_PATH]: ({ width, height }) => `
    0 ${height}
    ${width} ${height}
    ${width * 0.5} ${height - width * 0.6}
  `,
};

const labelOffsets = {
  [XP.TO_BUS_PATH]: 14,
  [XP.FROM_BUS_PATH]: 4,
};

const BusNodeBody = ({ type, size, pins, label }) => {
  const polygonProps = {
    points: polygonPointsGetters[type](size),
    strokeLinejoin: 'round',
  };

  const dataType = R.compose(
    getRenderablePinType,
    R.head, // bus nodes have exactly one pin
    R.values
  )(pins);

  return (
    <g>
      <polygon className="body" {...polygonProps} />
      <NodeLabel
        text={label}
        width={size.width}
        height={size.width}
        y={labelOffsets[type]}
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
  size: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  /* eslint-enable react/no-unused-prop-types */
};

export default BusNodeBody;
