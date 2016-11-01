import React from 'react';
import SVGLayer from './SVGLayer';
import Node from './Node';
import { LAYER } from 'xod-core';

const NodesLayer = ({ nodes, onMouseDown, onPinMouseUp, onPinMouseDown }) => (
  <SVGLayer
    name={LAYER.NODES}
    className="NodesLayer"
  >
    {nodes.map(node =>
      <Node
        key={node.id}
        id={node.id}
        label={node.label}
        position={node.position}
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

NodesLayer.propTypes = {
  nodes: React.PropTypes.arrayOf(React.PropTypes.object),
  onMouseDown: React.PropTypes.func,
  onPinMouseUp: React.PropTypes.func,
  onPinMouseDown: React.PropTypes.func,
};

export default NodesLayer;
