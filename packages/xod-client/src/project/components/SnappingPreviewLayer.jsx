import React from 'react';
import cn from 'classnames';

import SVGLayer from './SVGLayer';
import {
  getSnappedPosition,
  isValidPosition,
  NODE_CORNER_RADIUS,
} from '../nodeLayout';

class SnappingPreviewLayer extends React.Component {
  constructor(props) {
    super(props);
    this.displayName = 'SnappingPreviewLayer';
  }

  shouldComponentUpdate(nextProps) {
    return !!(nextProps.draggedNodeId || this.props.draggedNodeId);
  }

  render() {
    const {
      nodes,
      draggedNodeId,
      mousePosition,
    } = this.props;

    if (!draggedNodeId) return null;

    const dragGhostPosition = getSnappedPosition(mousePosition);

    const isValid = isValidPosition(nodes, draggedNodeId, dragGhostPosition);
    const draggedNodeSize = nodes[draggedNodeId].size;

    const className = cn('SnappingPreview', { isValid });

    return (
      <SVGLayer
        name={'TODO'}
        className="SnappingPreviewLayer"
      >
        <rect
          className={className}
          {...dragGhostPosition}
          {...draggedNodeSize}
          rx={NODE_CORNER_RADIUS}
          ry={NODE_CORNER_RADIUS}
        />
      </SVGLayer>
    );
  }
}

SnappingPreviewLayer.propTypes = {
  mousePosition: React.PropTypes.objectOf(React.PropTypes.number),
  draggedNodeId: React.PropTypes.any,
  nodes: React.PropTypes.any,
};

export default SnappingPreviewLayer;
