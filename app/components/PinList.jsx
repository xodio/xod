import React from 'react'
import R from 'ramda'
import Pin from '../components/Pin.jsx'

const PinList = ({pins, viewState, style}) => {

  pins = R.values(pins);

  const elId = 'pinlist_'+pins.id;

  return (
    <g key={elId} id={elId}>
      {pins.map( (pin) =>
        <Pin key={pin.id} data={pin} viewState={viewState[pin.id]} style={style} />
      )}
    </g>
  );
};

export default PinList;