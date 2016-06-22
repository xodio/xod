import React from 'react'
import R from 'ramda'
import Pin from '../components/Pin.jsx'

function PinList ({ radius, pins, viewState}) {
  const _pins = R.values(pins);
  return (
    <g className="pinlist">
      {_pins.map( (pin) =>
        <Pin key={'pin_' + pin.id} data={pin} viewState={viewState[pin.id]} radius={radius} />
      )}
    </g>
  );
}

export default PinList;