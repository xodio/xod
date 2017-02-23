import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { storiesOf, action } from '@kadira/storybook';

import '../src/core/styles/main.scss';
import Pin from '../src/project/components/Pin';
// because filters are defined there
import PatchSVG from '../src/project/components/PatchSVG';

const pinCenter = { x: 70, y: 70 };

const baseProps = {
  keyName: "my pin's keyname",
  injected: false,
  pinLabel: 'PIN',
  type: 'string',
  direction: 'input',
  position: pinCenter,
  onMouseUp: action('mouseUp'),
  onMouseDown: action('mouseDown'),
  isSelected: false,
  isConnected: false,
};

storiesOf('Pin', module)
  .addDecorator(story => (
    <PatchSVG>
      <rect width={pinCenter.x * 2} height={pinCenter.y * 2} fill="#676767" />
      <line x1={pinCenter.x} y1="0" x2={pinCenter.x} y2={pinCenter.y * 2} stroke="#373737" />
      <line x1="0" y1={pinCenter.y} x2={pinCenter.x * 2} y2={pinCenter.y} stroke="#373737" />
      <text y=".6em" fontSize="11" dy="0" fill="white">
        <tspan x=".3em" dy=".6em">cross line indicates center</tspan>
        <tspan x=".3em" dy="1.2em">position passed to pin</tspan>
      </text>
      {story()}
    </PatchSVG>
  ))
  .add('input', () => (
    <Pin
      {...baseProps}
      direction="input"
    />
  ))
  .add('output', () => (
    <Pin
      {...baseProps}
      direction="output"
    />
  ))
  .add('selected', () => (
    <Pin
      {...baseProps}
      isSelected
    />
  ))
  .add('connected', () => (
    <Pin
      {...baseProps}
      isConnected
    />
  ));

