import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';
import { noop } from 'xod-func-tools';

import { NODE_CORNER_RADIUS } from '../../nodeLayout';
import NodeLabel from './NodeLabel';
import VariadicHandle from './VariadicHandle';
import ResizeHandle from './ResizeHandle';

const NODE_BODY_RECT_PROPS = {
  rx: NODE_CORNER_RADIUS,
  ry: NODE_CORNER_RADIUS,
  // size is set in root svg, let's occupy it all
  width: '100%',
  height: '100%',
};

// To prevent the label from sticking to the node outline
// NodeLabel block is shifted to the right by this value
// and has reduced width by doubled value
const NODE_LABEL_MARGIN = 2;

const RegularNodeBody = props => (
  <g>
    <rect className="body" {...NODE_BODY_RECT_PROPS} />
    <NodeLabel
      text={props.label || XP.getBaseName(props.type)}
      width={props.size.width - NODE_LABEL_MARGIN * 2}
      height={props.size.height}
      x={NODE_LABEL_MARGIN}
    />
    <rect className="outline" {...NODE_BODY_RECT_PROPS} />
    {props.isVariadic ? (
      <VariadicHandle
        size={props.size}
        onMouseDown={event => {
          event.stopPropagation();
          props.onVariadicHandleDown(event, props.id);
        }}
      />
    ) : null}
    {props.isResizable ? <ResizeHandle {...props} /> : null}
  </g>
);

RegularNodeBody.defaultProps = {
  onVariadicHandleDown: noop,
};

RegularNodeBody.propTypes = {
  id: PropTypes.string,
  type: PropTypes.string,
  label: PropTypes.string,
  isVariadic: PropTypes.bool,
  isResizable: PropTypes.bool,
  size: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  onVariadicHandleDown: PropTypes.func,
  onResizeHandleMouseDown: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
};

export default RegularNodeBody;
