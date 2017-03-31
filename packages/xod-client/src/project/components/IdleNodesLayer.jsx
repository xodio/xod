import React from 'react';
import { LAYER } from '../../editor/constants';

import { isNodeSelected } from '../../editor/utils';

import SVGLayer from './SVGLayer';
import Node from './Node';

const IdleNodesLayer = ({
  nodes,
  draggedNodeId,
  selection,
  linkingPin,
  pinLinkabilityValidator,
  onMouseDown,
  onPinMouseUp,
  onPinMouseDown,
}) => (
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
        isSelected={isNodeSelected(selection, node.id)}
        isGhost={node.isGhost}
        linkingPin={linkingPin}
        pinLinkabilityValidator={pinLinkabilityValidator}
        onMouseDown={onMouseDown}
        onPinMouseUp={onPinMouseUp}
        onPinMouseDown={onPinMouseDown}
      />
    )}
  </SVGLayer>
);

IdleNodesLayer.propTypes = {
  nodes: React.PropTypes.arrayOf(React.PropTypes.object),
  selection: React.PropTypes.arrayOf(React.PropTypes.object),
  linkingPin: React.PropTypes.object,
  draggedNodeId: React.PropTypes.string,
  pinLinkabilityValidator: React.PropTypes.func,
  onMouseDown: React.PropTypes.func,
  onPinMouseUp: React.PropTypes.func,
  onPinMouseDown: React.PropTypes.func,
};

export default IdleNodesLayer;
