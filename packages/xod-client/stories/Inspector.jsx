import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { PIN_TYPE } from 'xod-project';

import '../src/core/styles/main.scss';
import Inspector from '../src/editor/components/Inspector';

const somePoint = { x: 0, y: 0 };

const baseProps = {
  selection: [],
  onPropUpdate: action('onPropUpdate'),
  currentPatch: {},
};

const linksSelection = {
  entityType: 'Link',
  data: {
    id: 'MyLiNkId',
    output: { nodeId: 'OuTpUtNoDeID', pinKey: 'state' },
    input: { nodeId: 'iNpUtNoDeID', pinKey: 'brightness' },
    type: 'boolean',
    from: somePoint,
    to: somePoint,
  },
};

const nodeSelection = {
  entityType: 'Node',
  data: {
    id: 'ByWmOEefAg',
    type: 'xod/core/somenode',
    position: somePoint,
    label: 'My label',
    description: 'My node description',
    boundValues: {},
    pins: {
      samplePulse: {
        description: '',
        direction: 'input',
        key: 'samplePulse',
        label: 'SPLS',
        order: 0,
        type: PIN_TYPE.PULSE,
        value: false,
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        isBindable: true,
        position: somePoint,
      },
      sampleStr: {
        description: '',
        direction: 'input',
        key: 'sampleStr',
        label: 'SSTR',
        order: 1,
        type: PIN_TYPE.STRING,
        value: 'foo',
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        isBindable: true,
        position: somePoint,
      },
      sampleNum: {
        description: '',
        direction: 'input',
        key: 'sampleNum',
        label: 'SNM',
        order: 2,
        type: PIN_TYPE.NUMBER,
        value: 24,
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        isBindable: true,
        position: somePoint,
      },
      sampleBool: {
        description: '',
        direction: 'input',
        key: 'sampleBool',
        label: 'SBOO',
        order: 3,
        type: PIN_TYPE.BOOLEAN,
        value: true,
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        isBindable: true,
        position: somePoint,
      },
      samplePulseOutput: {
        description: '',
        direction: 'output',
        key: 'samplePulseOutput',
        label: 'SPLO',
        order: 4,
        type: PIN_TYPE.PULSE,
        value: false,
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        isBindable: false,
        position: somePoint,
      },
      sampleStrConnected: {
        description: '',
        direction: 'input',
        key: 'sampleStrConnected',
        label: 'SSTC',
        order: 5,
        type: PIN_TYPE.STRING,
        value: 'foo',
        nodeId: 'ByWmOEefAg',
        isConnected: true,
        isBindable: true,
        position: somePoint,
      },
      sampleNumConnected: {
        description: '',
        direction: 'input',
        key: 'sampleNumConnected',
        label: 'SNMC',
        order: 6,
        type: PIN_TYPE.NUMBER,
        value: 24,
        nodeId: 'ByWmOEefAg',
        isConnected: true,
        isBindable: true,
        position: somePoint,
      },
      sampleBoolConnected: {
        description: '',
        direction: 'input',
        key: 'sampleBoolConnected',
        label: 'SBLC',
        order: 7,
        type: PIN_TYPE.BOOLEAN,
        value: true,
        nodeId: 'ByWmOEefAg',
        isConnected: true,
        isBindable: true,
        position: somePoint,
      },
      samplePulseConnected: {
        description: '',
        direction: 'output',
        key: 'samplePulseConnected',
        label: 'SPLC',
        order: 8,
        type: PIN_TYPE.PULSE,
        value: false,
        nodeId: 'ByWmOEefAg',
        isConnected: true,
        isBindable: false,
        position: somePoint,
      },
      value: {
        description: '',
        direction: 'output',
        key: 'value',
        label: 'VAL',
        order: 9,
        type: 'number',
        value: 0,
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        // won't happen in real project because this node has pulse pins, but useful for UI demo
        isBindable: false,
        position: somePoint,
      },
    },
    size: { width: 108, height: 72 },
  },
};

const singleLinkSelection = [linksSelection];
const singleNodeSelection = [nodeSelection];
const multipleSelection = [nodeSelection, linksSelection, nodeSelection];

const containerStyle = {
  width: 200,
};

storiesOf('Inspector', module)
  .addDecorator(story => (
    <div style={containerStyle}>
      {story()}
    </div>
  ))
  .add('no selection', () => (
    <Inspector
      {...baseProps}
    />
  ))
  .add('selected link', () => (
    <Inspector
      {...baseProps}
      selection={singleLinkSelection}
    />
  ))
  .add('selected node', () => (
    <Inspector
      {...baseProps}
      selection={singleNodeSelection}
    />
  ))
  .add('multi selection', () => (
    <Inspector
      {...baseProps}
      selection={multipleSelection}
    />
  ));

