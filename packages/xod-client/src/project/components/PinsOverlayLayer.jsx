import R from 'ramda';
import React from 'react';
import { LAYER } from '../../editor/constants';

import SVGLayer from './SVGLayer';
import PinsOverlay from './PinsOverlay';
import { getPinLinkabilityValidator } from '../utils';

const PinsOverlayLayer = ({
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
              <PinsOverlay
                key={node.id}
                id={node.id}
                position={node.position}
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

PinsOverlayLayer.propTypes = {
  nodes: React.PropTypes.objectOf(React.PropTypes.object),
  linkingPin: React.PropTypes.object,
  onPinMouseUp: React.PropTypes.func,
  onPinMouseDown: React.PropTypes.func,
};

export default PinsOverlayLayer;
