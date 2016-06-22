import React from 'react';
import R from 'ramda';
import Pin from '../components/Pin';

function PinList({ radius, pins, viewState }) {
  const pinsArr = R.values(pins);
  return (
    <g className="pinlist">
      {pinsArr.map((pin) =>
        <Pin key={`pin_${pin.id}`} data={pin} viewState={viewState[pin.id]} radius={radius} />
      )}
    </g>
  );
}

PinList.propTypes = {
  radius: React.PropTypes.number.isRequired,
  pins: React.PropTypes.any.isRequired,
  viewState: React.PropTypes.any.isRequired,
};

export default PinList;
