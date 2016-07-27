import React from 'react';
import SVGLayer from './SVGLayer';
import Node from '../components/Node';
import { NODES as LAYER_NAME } from '../constants/layers';

const Nodes = ({ nodes, onMouseUp, onMouseDown, onPinMouseUp }) => (
  <SVGLayer name={LAYER_NAME}>
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

Nodes.propTypes = {
  nodes: React.PropTypes.arrayOf(React.PropTypes.object),
  onMouseUp: React.PropTypes.func,
  onMouseDown: React.PropTypes.func,
  onPinMouseUp: React.PropTypes.func,
};

export default Nodes;
