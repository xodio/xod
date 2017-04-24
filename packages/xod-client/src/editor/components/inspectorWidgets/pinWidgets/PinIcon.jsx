import React from 'react';

import { noop } from '../../../../utils/ramda';
import Pin from '../../../../project/components/Pin';
import { PIN_RADIUS_WITH_SHADOW } from '../../../../project/nodeLayout';

const pinPos = { x: PIN_RADIUS_WITH_SHADOW, y: PIN_RADIUS_WITH_SHADOW };

const PinIcon = ({ id, type, isConnected }) => (
  <svg width={PIN_RADIUS_WITH_SHADOW * 2} height={PIN_RADIUS_WITH_SHADOW * 2} className="PinIcon">
    <Pin
      keyName={`widgetPinIcon_${id}`}
      type={type}
      position={pinPos}
      onMouseUp={noop}
      onMouseDown={noop}
      isSelected={false}
      isConnected={isConnected}
      isAcceptingLinks={false}
    />
  </svg>
);

PinIcon.displayName = 'PinIcon';

PinIcon.propTypes = {
  id: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  isConnected: React.PropTypes.bool.isRequired,
};

export default PinIcon;
