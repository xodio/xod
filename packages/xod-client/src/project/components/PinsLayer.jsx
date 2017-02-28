import React from 'react';
import { LAYER } from 'xod-core';

import SVGLayer from './SVGLayer';
import NodePins from './NodePins';

const PinsLayer = ({ nodes, onPinMouseUp, onPinMouseDown }) => (
  <SVGLayer
    name={LAYER.NODES}
    className="PinsLayer"
  >
    {nodes.map(node =>
      <NodePins
        key={node.id}
        id={node.id}
        position={node.position}
        size={node.size}
        pins={node.pins}
        onPinMouseUp={onPinMouseUp}
        onPinMouseDown={onPinMouseDown}
      />
    )}
  </SVGLayer>
);

PinsLayer.propTypes = {
  nodes: React.PropTypes.arrayOf(React.PropTypes.object),
  onPinMouseUp: React.PropTypes.func,
  onPinMouseDown: React.PropTypes.func,
};

export default PinsLayer;
