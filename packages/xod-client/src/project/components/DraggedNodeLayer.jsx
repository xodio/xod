import React from 'react';

import SVGLayer from './SVGLayer';
import Node from './Node';

class DraggedNodeLayer extends React.Component {
  constructor(props) {
    super(props);
    this.displayName = 'DraggedNodeLayer';
  }

  shouldComponentUpdate(nextProps) {
    return !!(nextProps.draggedNodeId || this.props.draggedNodeId);
  }

  render() {
    const {
      nodes,
      draggedNodeId,
    } = this.props;

    if (!draggedNodeId) return null;

    const node = nodes[draggedNodeId];

    return (
      <SVGLayer
        name="DraggedNode"
        className="DraggedNodeLayer"
      >
        <Node
          key={node.id}
          id={node.id}
          label={node.label}
          position={node.position}
          size={node.size}
          outputPinsSectionHeight={node.outputPinsSectionHeight}
          pins={node.pins}
          width={node.width}
          isSelected={node.isSelected}
          isGhost={node.isGhost}
          isDragged
        />
      </SVGLayer>
    );
  }
}

DraggedNodeLayer.propTypes = {
  draggedNodeId: React.PropTypes.any,
  nodes: React.PropTypes.any,
};

export default DraggedNodeLayer;
