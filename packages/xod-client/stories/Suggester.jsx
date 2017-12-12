import React from 'react';
import { storiesOf } from '@storybook/react';

import { createIndex } from 'xod-patch-search';

import Suggester from '../src/editor/components/Suggester';
import '../src/core/styles/main.scss';

const indexData = [
  {
    path: 'xod/core/absolute',
    keywords: ['absolute'],
    lib: 'xod/core',
    description: 'Outputs absolute value of an input number',
    fullDescription: '#Absolute \n\nIt\'s a simple math node, that outputs absolute value an input number.',
  },
  {
    path: 'xod/core/add',
    keywords: ['add'],
    lib: 'xod/core',
    description: 'Adds two numbers',
    fullDescription: '#Add \n\nOutputs a sum of two input numbers',
  },
  {
    path: 'xod/core/ceil',
    keywords: ['ceil'],
    lib: 'xod/core',
    description: 'Rounds a number to a minimal integer that is greater than the number',
    fullDescription: '#Ceil \n\nIt\'s a simple math node, that round a number to a minimal integer. E.G. `2.36` will become `3`',
  },
  {
    path: 'xod/core/console-log',
    keywords: ['console', 'log'],
    lib: 'xod/core',
    description: 'Outputs a line of text to the board standard debug interface. Use serial port monitor with rate 9600 by default. Enjoy debugging your XOD programms!',
    fullDescription: '#Console-log \n\nIt prints an input string into standard debug interface (serial)',
  },
  {
    path: 'xod/core/constant-boolean',
    keywords: ['constant', 'boolean'],
    lib: 'xod/core',
    description: 'Constant value',
    fullDescription: '#Constant-boolean \n\nIt provides to set constant boolean value: true or false',
  },
  {
    path: 'xod/core/constant-number',
    keywords: ['constant', 'number'],
    lib: 'xod/core',
    description: 'Constant value',
    fullDescription: '#Constant-number \n\nIt provides to set constant number value, it could be negative, positive or equal zero.',
  },
];

storiesOf('Suggester', module)
  .addDecorator(story => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        background: '#676767',
      }}
    >
      {story()}
    </div>
  ))
  .add('basic', () => (
    <Suggester
      index={createIndex(indexData)}
      onAddNode={(val) => {
        // eslint-disable-next-line
        alert(`Node "${val}" will be placed!`);
      }}
    />
  ));
