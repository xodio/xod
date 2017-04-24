import R from 'ramda';
import React from 'react';
import { LAYER } from '../../editor/constants';

import { isNodeSelected } from '../../editor/utils';
import { canPinsBeLinked } from '../utils';

import SVGLayer from './SVGLayer';
import Node from './Node';

const getPinLinkabilityValidator = (linkingPin, nodes) => {
  if (!linkingPin) {
    return R.F;
  }

  const selectedPin = R.path([linkingPin.nodeId, 'pins', linkingPin.pinKey], nodes);

  return canPinsBeLinked(selectedPin);
};

const IdleNodesLayer = ({
  nodes,
  draggedNodeId,
  selection,
  linkingPin,
  onMouseDown,
  onPinMouseUp,
  onPinMouseDown,
}) => {
  const pinLinkabilityValidator = getPinLinkabilityValidator(linkingPin, nodes);

  return (
    <SVGLayer
      name={LAYER.NODES}
      className="IdleNodesLayer"
    >
      {R.compose(
        R.map(
          node =>
            <Node
              hidden={node.id === draggedNodeId}
              key={node.id}
              id={node.id}
              label={node.label}
              type={node.type}
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
        ),
        R.values
      )(nodes)}
    </SVGLayer>
  );
};

IdleNodesLayer.propTypes = {
  nodes: React.PropTypes.objectOf(React.PropTypes.object),
  selection: React.PropTypes.arrayOf(React.PropTypes.object),
  linkingPin: React.PropTypes.object,
  draggedNodeId: React.PropTypes.string,
  onMouseDown: React.PropTypes.func,
  onPinMouseUp: React.PropTypes.func,
  onPinMouseDown: React.PropTypes.func,
};

export default IdleNodesLayer;
