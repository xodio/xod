import React from 'react';
import PropTypes from 'prop-types';
import { noop } from 'xod-func-tools';

import { NODE_CORNER_RADIUS, RESIZE_HANDLE_SIZE } from '../../nodeLayout';

const ResizeHandle = ({ id, size, onResizeHandleMouseDown }) => (
  <path
    key={`node_${id}_resizeHandle`}
    className="NodeResizeHandle"
    onMouseDownCapture={event => {
      event.stopPropagation();
      return onResizeHandleMouseDown(event, id);
    }}
    d={`
          M${size.width - RESIZE_HANDLE_SIZE} ${size.height}
          l ${RESIZE_HANDLE_SIZE} ${-RESIZE_HANDLE_SIZE}
          v ${RESIZE_HANDLE_SIZE - NODE_CORNER_RADIUS}
          c 0 ${NODE_CORNER_RADIUS /
            2}, 0 ${NODE_CORNER_RADIUS}, ${-NODE_CORNER_RADIUS} ${NODE_CORNER_RADIUS}
          h ${-RESIZE_HANDLE_SIZE + NODE_CORNER_RADIUS}
          Z
        `}
  />
);

ResizeHandle.propTypes = {
  id: PropTypes.string.isRequired,
  size: PropTypes.object.isRequired,
  onResizeHandleMouseDown: PropTypes.func,
};

ResizeHandle.defaultProps = {
  onResizeHandleMouseDown: noop,
};

export default ResizeHandle;
