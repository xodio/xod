import React from 'react';

const Pin = ({data}) => {

  console.log('>>>>', data);

  const elId = 'pin_'+data.id;

  const radius = data.radius;
  const circleProps = {
    cx: data.position.x + radius + 1,
    cy: data.position.y + radius + 1,
    r: radius,
    fill: 'darkgrey',
    stroke: 'black',
    strokeWidth: 1
  };
  const textProps = {
    x: data.position.x + radius,
    y: data.position.y + radius
  }

  return (
    <g id={elId}>
      <circle {...circleProps} />
      <text {...textProps} aligmentBaseline="central" fill="black" fontSize="12">{data.key}</text>
    </g>
  );
};

export default Pin;