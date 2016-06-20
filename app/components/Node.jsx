import React from 'react';
import PinList from '../components/PinList.jsx'

const Node = ({node, pins}) => {

  const elId = 'node_'+node.id;

  const paddings = {
    y: 25,
    x: 2
  };

  const rectSize = {
    width: 100,
    height: 60,
    x: paddings.x,
    y: paddings.y
  };

  const textBox = {
    x: (rectSize.width / 2) + rectSize.x,
    y: (rectSize.height /2) + rectSize.y
  };

  const blockSize = {
    width: rectSize + (paddings.x * 2),
    height: rectSize + (paddings.y * 2)
  };

  return (
    <svg {...node.position} key={elId} id={elId}>
      <rect {...blockSize} />
      <rect {...rectSize} fill="lightgrey" stroke="black" strokeSize="1" />
      <text {...textBox} textAnchor="middle" aligmentBaseline="central" fill="black" fontSize="12">{node.id}</text>
      <PinList pins={pins} paddings={paddings} nodeSize={rectSize} />
    </svg>
  );
};

export default Node;