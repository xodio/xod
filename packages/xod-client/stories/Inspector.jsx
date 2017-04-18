import React from 'react';
import { storiesOf, action } from '@kadira/storybook';

import '../src/core/styles/main.scss';
import Inspector from '../src/editor/components/Inspector';
import PinShadowFilter from '../src/project/components/filters/PinShadowFilter';

import { PROPERTY_TYPE } from '../src/editor/constants';


const somePoint = { x: 0, y: 0 };

const baseProps = {
  selection: [],
  onPropUpdate: action('onPropUpdate'),
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
    pins: {
      samplePulse: {
        description: '',
        direction: 'input',
        key: 'samplePulse',
        label: 'SPLS',
        order: 0,
        type: PROPERTY_TYPE.PULSE,
        value: false,
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        position: somePoint,
      },
      sampleStr: {
        description: '',
        direction: 'input',
        key: 'sampleStr',
        label: 'SSTR',
        order: 1,
        type: PROPERTY_TYPE.STRING,
        value: 'foo',
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        position: somePoint,
      },
      sampleNum: {
        description: '',
        direction: 'input',
        key: 'sampleNum',
        label: 'SNM',
        order: 2,
        type: PROPERTY_TYPE.NUMBER,
        value: 24,
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        position: somePoint,
      },
      sampleBool: {
        description: '',
        direction: 'input',
        key: 'sampleBool',
        label: 'SBOO',
        order: 3,
        type: PROPERTY_TYPE.BOOL,
        value: true,
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        position: somePoint,
      },
      value: {
        description: '',
        direction: 'output',
        key: 'value',
        label: 'value',
        order: 0,
        type: 'number',
        value: 0,
        nodeId: 'ByWmOEefAg',
        isConnected: false,
        position: somePoint,
      },
    },
    size: { width: 108, height: 72 },
    outputPinsSectionHeight: 25,
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
      <svg width="0" height="0">
        <defs>
          {/* For rendering pin correctly. Usually rendered by PatchSVG component */}
          <PinShadowFilter />
        </defs>
      </svg>
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

