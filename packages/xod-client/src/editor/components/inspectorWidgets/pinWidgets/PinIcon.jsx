import React from 'react';

import { noop } from '../../../../utils/ramda';
import Pin from '../../../../project/components/Pin';

const pinPos = { x: 10, y: 14 };

const PinIcon = ({ id, type, isConnected }) => (
  <svg width="20" height="28" className="PinIcon">
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
