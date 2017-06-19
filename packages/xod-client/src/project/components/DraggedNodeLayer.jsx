import React from 'react';

import SVGLayer from './SVGLayer';
import Node from './Node';

class DraggedNodeLayer extends React.PureComponent {
  render() {
    const {
      node,
      position,
    } = this.props;

    if (!node) return null;

    return (
      <SVGLayer
        name="DraggedNodeLayer"
        className="DraggedNodeLayer"
      >
        <Node
          key={`node_${node.id}`}
          id={node.id}
          label={node.label}
          type={node.type}
          position={position}
          size={node.size}
          outputPinsSectionHeight={node.outputPinsSectionHeight}
          pins={node.pins}
          isGhost={node.isGhost}
          isSelected
          isDragged
        />
      </SVGLayer>
    );
  }
}

DraggedNodeLayer.displayName = 'DraggedNodeLayer';

DraggedNodeLayer.propTypes = {
  position: React.PropTypes.any,
  node: React.PropTypes.any,
};

export default DraggedNodeLayer;
