import { assert } from 'chai';
import * as T from '../src/templates';

import inputImpl from './fixtures/impl.input.cpp';

import configFixture from './fixtures/config.cpp';
import implListFixture from './fixtures/implList.cpp';
import programFixture from './fixtures/program.cpp';

describe('xod-arduino templates', () => {
  let config;
  let patches;
  let nodes;

  beforeEach(() => {
    config = {
      NODE_COUNT: 8,
      MAX_OUTPUT_COUNT: 3,
      XOD_DEBUG: false,
      DEFER_NODE_COUNT: 0,
    };
    patches = [
      {
        owner: 'xod',
        libName: 'math',
        patchName: 'multiply',
        outputs: [
          {
            type: 'Number',
            pinKey: 'OUT',
            value: 0,
          },
        ],
        inputs: [
          {
            type: 'Number',
            pinKey: 'IN1',
          },
          {
            type: 'Number',
            pinKey: 'IN2',
          },
        ],
        impl: inputImpl,
      },
    ];
    nodes = [
      {
        id: 0,
        originalId: '17asd13z',
        patch: patches[0],
        outputs: [
          {
            to: [1],
            pinKey: 'OUT',
            value: 42,
          },
        ],
        inputs: [],
        dirtyFlags: 255,
      },
      {
        id: 1,
        originalId: '91ns7an_a',
        patch: patches[0],
        outputs: [],
        inputs: [
          {
            nodeId: 0,
            patch: patches[0],
            pinKey: 'IN1',
            fromPinKey: 'OUT',
          },
        ],
        dirtyFlags: 255,
      },
    ];
  });

  it('configuration should render properly', () => {
    const result = T.renderConfig(config);
    assert.strictEqual(result, configFixture);
  });

  it('implementation list should render properly', () => {
    const result = T.renderImplList(patches);
    assert.strictEqual(result, implListFixture);
  });

  it('program should render properly', () => {
    const result = T.renderProgram(nodes);
    assert.strictEqual(result, programFixture);
  });
});
