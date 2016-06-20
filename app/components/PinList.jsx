import React from 'react';
import R from 'ramda';
import Pin from '../components/Pin.jsx'

const PinList = ({pins, paddings, nodeSize}) => {

  pins = R.values(pins);

  let pinsByType = R.groupBy((pin)=>{ return pin.type; }, pins);

  let center = {
    x: nodeSize.width / 2 + nodeSize.x,
    y: nodeSize.height / 2 + nodeSize.y
  };

  const radius = 5;
  const vOffset = {
    input: nodeSize.y - radius,
    output: nodeSize.y + nodeSize.height - radius
  };
  const xPadding = 15;

  for (let type in pinsByType) {
    let offset = 0;

    let count = pinsByType[type].length;
    let maxWidth = (count * radius) + (count - 1) * xPadding;
    let beginX = center.x - maxWidth;


    for (let i in pinsByType[type]) {
      pinsByType[type][i].radius = radius;
      pinsByType[type][i].position = {
        x: beginX + offset,
        y: vOffset[type]
      };
      offset += xPadding;
    }
  }

  pins = R.flatten(R.values(pinsByType));

  console.log('!!!!', pins);

  const elId = 'pinlist_'+pins.id;

  return (
    <g key={elId} id={elId}>
      {pins.map( (pin) =>
        <Pin key={pin.id} data={pin} />
      )}
    </g>
  );
};

export default PinList;