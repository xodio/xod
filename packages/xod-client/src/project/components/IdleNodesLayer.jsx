import React from 'react';
import { LAYER } from 'xod-core';

import SVGLayer from './SVGLayer';
import Node from './Node';

const IdleNodesLayer = ({ nodes, draggedNodeId, onMouseDown, onPinMouseUp, onPinMouseDown }) => (
  <SVGLayer
    name={LAYER.NODES}
    className="IdleNodesLayer"
  >
    {nodes.map(node =>
      <Node
        hidden={node.id === draggedNodeId}
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
        onMouseDown={onMouseDown}
        onPinMouseUp={onPinMouseUp}
        onPinMouseDown={onPinMouseDown}
      />
    )}
  </SVGLayer>
);

IdleNodesLayer.propTypes = {
  nodes: React.PropTypes.arrayOf(React.PropTypes.object),
  draggedNodeId: React.PropTypes.string,
  onMouseDown: React.PropTypes.func,
  onPinMouseUp: React.PropTypes.func,
  onPinMouseDown: React.PropTypes.func,
};

export default IdleNodesLayer;
