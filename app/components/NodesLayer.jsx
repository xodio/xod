import React from 'react';
import SVGLayer from './SVGLayer';
import Node from './Node';
import { NODES as LAYER_NAME } from '../constants/layers';

const NodesLayer = ({ nodes, onMouseUp, onMouseDown, onPinMouseUp }) => (
  <SVGLayer
    name={LAYER_NAME}
    className="NodesLayer"
  >
    {nodes.map(node =>
      <Node
        key={node.id}
        id={node.id}
        label={node.label}
        position={node.position}
        pins={node.pins}
        isSelected={node.isSelected}
        isGhost={node.isGhost}
        onMouseUp={onMouseUp}
        onMouseDown={onMouseDown}
        onPinMouseUp={onPinMouseUp}
      />
    )}
  </SVGLayer>
);

NodesLayer.propTypes = {
  nodes: React.PropTypes.arrayOf(React.PropTypes.object),
  onMouseUp: React.PropTypes.func,
  onMouseDown: React.PropTypes.func,
  onPinMouseUp: React.PropTypes.func,
};

export default NodesLayer;
