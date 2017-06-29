import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
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
  nodes: PropTypes.objectOf(PropTypes.object),
  linkingPin: PropTypes.object,
  onPinMouseUp: PropTypes.func,
  onPinMouseDown: PropTypes.func,
};

export default PinsOverlayLayer;
