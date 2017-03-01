import React from 'react';
import { storiesOf } from '@kadira/storybook';

import '../src/core/styles/main.scss';
import XODLink from '../src/project/components/Link';

const pFrom = { x: 30, y: 30 };
const pTo = { x: 120, y: 120 };

const baseProps = {
  id: 'qwerty',
  from: pFrom,
  to: pTo,
  isGhost: false,
  isSelected: false,
  type: 'string',
};

storiesOf('Link', module)
  .addDecorator(story => (
    <svg>
      <rect width={(pFrom.x * 2) + pTo.x} height={(pFrom.y * 2) + pTo.x} fill="#676767" />
      <circle
        cx={pFrom.x}
        cy={pFrom.y}
        r="1"
        fill="red"
      />
      <circle
        cx={pTo.x}
        cy={pTo.y}
        r="1"
        fill="red"
      />
      {story()}
    </svg>
  ))
  .add('string', () => (
    <XODLink
      {...baseProps}
      type="string"
    />
  ))
  .add('bool', () => (
    <XODLink
      {...baseProps}
      type="bool"
    />
  ))
  .add('number', () => (
    <XODLink
      {...baseProps}
      type="number"
    />
  ))
  .add('pulse', () => (
    <XODLink
      {...baseProps}
      type="pulse"
    />
  ))
  .add('selected', () => (
    <XODLink
      {...baseProps}
      isSelected
    />
  ));

