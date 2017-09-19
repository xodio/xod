import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { getBaseName } from 'xod-project';

import pureDeepEqual from '../../../utils/pureDeepEqual';

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
    <g className="PinsOverlayLayer">
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
    </g>
  );
};

NodePinsOverlayLayer.propTypes = {
  nodes: PropTypes.objectOf(PropTypes.object),
  linkingPin: PropTypes.object,
  onPinMouseUp: PropTypes.func,
  onPinMouseDown: PropTypes.func,
};

export default pureDeepEqual(NodePinsOverlayLayer);
