import React from 'react';
import PropTypes from 'prop-types';

import { noop } from '../../../../utils/ramda';
import Pin from '../../../../project/components/Pin';
import { PIN_RADIUS_WITH_SHADOW } from '../../../../project/nodeLayout';

const pinPos = { x: PIN_RADIUS_WITH_SHADOW, y: PIN_RADIUS_WITH_SHADOW };

const PinIcon = ({ id, type, isConnected, isLastVariadicGroup }) => (
  <svg width={PIN_RADIUS_WITH_SHADOW * 2} height={PIN_RADIUS_WITH_SHADOW * 2} className="PinIcon">
    <Pin
      keyName={`widgetPinIcon_${id}`}
      type={type}
      position={pinPos}
      onMouseUp={noop}
      onMouseDown={noop}
      isSelected={false}
      isConnected={isConnected}
      isLastVariadicGroup={isLastVariadicGroup}
      isAcceptingLinks={false}
    />
  </svg>
);

PinIcon.displayName = 'PinIcon';

PinIcon.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  isLastVariadicGroup: PropTypes.bool.isRequired,
};

export default PinIcon;
