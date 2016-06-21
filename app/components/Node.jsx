import React from 'react'
import PinList from '../components/PinList.jsx'

const Node = ({node, pins, style, viewState}) => {

  const elId = 'node_'+node.id;

  const paddings = style.node.padding;
  const position = viewState.nodes[node.id].bbox.getPosition();
  const rectSize = {
    width: style.node.width,
    height: style.node.height,
    x: paddings.x,
    y: paddings.y
  };
  const textBox = {
    x: (rectSize.width / 2) + rectSize.x,
    y: (rectSize.height /2) + rectSize.y
  };
  const blockSize = {
    x: 0,
    y: 0,
    width: rectSize.width + (paddings.x * 2),
    height: rectSize.height + (paddings.y * 2)
  };

  return (
    <svg {...position} key={elId} id={elId}>
      <rect {...blockSize} style={style.node.block} />
      <rect {...rectSize} style={style.node.rect} />
      <text {...textBox} textAnchor="middle" aligmentBaseline="central" fill="black" fontSize="12">{node.id}</text>
      <PinList pins={pins} viewState={viewState.pins} style={style.pin} />
    </svg>
  );
};

export default Node;