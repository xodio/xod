import React from 'react';
import R from 'ramda';
import Pin from '../components/Pin';

function PinList({ radius, pins }) {
  const pinsArr = R.values(pins);
  return (
    <g className="pinlist">
      {pinsArr.map((pin) =>
        <Pin key={`pin_${pin.id}`} {...pin} radius={radius} />
      )}
    </g>
  );
}

PinList.propTypes = {
  radius: React.PropTypes.number.isRequired,
  pins: React.PropTypes.any.isRequired,
};

export default PinList;
