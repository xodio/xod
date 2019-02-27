import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as XP from 'xod-project';

import NodeLabel from './NodeLabel';

const TerminalNodeBody = props => {
  const isInput = XP.isInputTerminalPath(props.type);
  const radius = props.pxSize.width / 2;
  const yOffset = isInput ? props.pxSize.height - props.pxSize.width : 0;
  const circleProps = {
    cx: radius,
    cy: radius + yOffset,
    r: radius,
  };

  const terminalLabel = R.when(R.isEmpty, R.always(props.normalizedLabel))(
    props.label
  );

  return (
    <g className="terminal-node">
      <circle className="body" {...circleProps} />
      <NodeLabel
        text={terminalLabel}
        width={props.pxSize.width}
        height={props.pxSize.width}
        y={yOffset + (isInput ? -1 : 1)}
      />
      <circle
        className={classNames(
          'outline',
          R.compose(
            R.unless(XP.isBuiltInType, R.always('custom')),
            XP.getTerminalDataType
          )(props.type)
        )}
        {...circleProps}
      />
    </g>
  );
};

TerminalNodeBody.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  normalizedLabel: PropTypes.string,
  pxSize: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
};

export default TerminalNodeBody;
