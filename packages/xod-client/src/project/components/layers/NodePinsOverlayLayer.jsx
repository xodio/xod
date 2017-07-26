import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { getBaseName } from 'xod-project';

import { LAYER } from '../../../editor/constants';

import SVGLayer from './SVGLayer';
import NodePinsOverlay from '../NodePinsOverlay';
import { getPinLinkabilityValidator } from '../../utils';

const NodePinsOverlayLayer = ({
  nodes,
  linkingPin,
  onPinMouseUp,
  onPinMouseDown,
}) => {
  const pinLinkabilityValidator = getPinLinkabilityValidator(linkingPin, nodes);

  return (
    <SVGLayer
      name={LAYER.NODE_PINS_OVERLAY}
      className="PinsOverlayLayer"
    >
      {R.compose(
          R.map(
            node =>
              <NodePinsOverlay
                key={node.id}
                id={node.id}
                position={node.position}
                nodeLabel={node.label || getBaseName(node.type)}
                size={node.size}
                pins={node.pins}
                linkingPin={linkingPin}
                onPinMouseUp={onPinMouseUp}
                onPinMouseDown={onPinMouseDown}
                pinLinkabilityValidator={pinLinkabilityValidator}
              />
          ),
          R.values
        )(nodes)}
    </SVGLayer>
  );
};

NodePinsOverlayLayer.propTypes = {
  nodes: PropTypes.objectOf(PropTypes.object),
  linkingPin: PropTypes.object,
  onPinMouseUp: PropTypes.func,
  onPinMouseDown: PropTypes.func,
};

export default NodePinsOverlayLayer;
