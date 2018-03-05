import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as XP from 'xod-project';

import NodeLabel from './NodeLabel';

const TerminalNodeBody = props => {
  const isInput = XP.isInputTerminalPath(props.type);
  const radius = props.size.width / 2;
  const yOffset = isInput ? props.size.height - props.size.width : 0;
  const circleProps = {
    cx: radius,
    cy: radius + yOffset,
    r: radius,
  };

  return (
    <g>
      <circle className="body" {...circleProps} />
      <NodeLabel
        text={props.label}
        width={props.size.width}
        height={props.size.width}
        y={yOffset + (isInput ? -1 : 1)}
      />
      <circle
        className={classNames('outline', XP.getTerminalDataType(props.type))}
        {...circleProps}
      />
    </g>
  );
};

TerminalNodeBody.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  size: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
};

export default TerminalNodeBody;
