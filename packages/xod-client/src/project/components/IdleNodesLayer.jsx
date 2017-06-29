import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { LAYER } from '../../editor/constants';

import { isNodeSelected } from '../../editor/utils';
import { getPinLinkabilityValidator } from '../utils';

import SVGLayer from './SVGLayer';
import Node from './Node';

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
  nodes: PropTypes.objectOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.object),
  linkingPin: PropTypes.object,
  draggedNodeId: PropTypes.string,
  onMouseDown: PropTypes.func,
  onPinMouseUp: PropTypes.func,
  onPinMouseDown: PropTypes.func,
};

export default IdleNodesLayer;
