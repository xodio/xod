import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import SVGLayer from './SVGLayer';
import {
  snapNodePositionToSlots,
  isValidPosition,
  NODE_CORNER_RADIUS,
} from '../nodeLayout';

class SnappingPreviewLayer extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !!(nextProps.draggedNodeId || this.props.draggedNodeId);
  }

  render() {
    const {
      nodes,
      draggedNodeId,
      draggedNodePosition,
    } = this.props;

    if (!draggedNodeId) return null;

    const ghostPosition = snapNodePositionToSlots(draggedNodePosition);

    const isValid = isValidPosition(nodes, draggedNodeId, ghostPosition);
    const draggedNodeSize = nodes[draggedNodeId].size;

    const className = cn('SnappingPreview', { isValid });

    return (
      <SVGLayer
        name="SnappingPreviewLayer"
        className="SnappingPreviewLayer"
      >
        <rect
          className={className}
          {...ghostPosition}
          {...draggedNodeSize}
          rx={NODE_CORNER_RADIUS}
          ry={NODE_CORNER_RADIUS}
        />
      </SVGLayer>
    );
  }
}

SnappingPreviewLayer.displayName = 'SnappingPreviewLayer';

SnappingPreviewLayer.propTypes = {
  draggedNodeId: PropTypes.any,
  nodes: PropTypes.object.isRequired,
  draggedNodePosition: PropTypes.any,
};

export default SnappingPreviewLayer;
