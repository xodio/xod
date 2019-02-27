import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as XP from 'xod-project';

import { NODE_CORNER_RADIUS } from '../../nodeLayout';
import NodeLabel from './NodeLabel';
import ResizeHandle from './ResizeHandle';

const NODE_BODY_RECT_PROPS = {
  rx: NODE_CORNER_RADIUS,
  ry: NODE_CORNER_RADIUS,
  // pxSize is set in root svg, let's occupy it all
  width: '100%',
  height: '100%',
};

const WatchNodeBody = props => (
  <g className={classNames('watch-node', { active: props.isDebugSession })}>
    <rect className="body" {...NODE_BODY_RECT_PROPS} />
    <NodeLabel
      text={props.nodeValue || props.label || XP.getBaseName(props.type)}
      width={props.pxSize.width}
      height={props.pxSize.height}
    />
    <rect className="outline" {...NODE_BODY_RECT_PROPS} />
    <ResizeHandle {...props} />
  </g>
);

WatchNodeBody.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  pxSize: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  nodeValue: PropTypes.string,
  isDebugSession: PropTypes.bool,
  onResizeHandleMouseDown: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
};

export default WatchNodeBody;
