import R from 'ramda';
import chai, { assert } from 'chai';
import * as T from '../src/templates';

import inputImpl from './fixtures/impl.input.cpp';

import configFixture from './fixtures/config.cpp';
import implListFixture from './fixtures/implList.cpp';
import programFixture from './fixtures/program.cpp';

describe('xod-arduino templates', () => {
  let config;
  let patches;
  let nodes;
  let project;

  beforeEach(() => {
    config = {
      NODE_COUNT: 8,
      MAX_OUTPUT_COUNT: 3,
      XOD_DEBUG: false,
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
        isDirty: false,
      },
    ];
    nodes = [
      {
        id: 0,
        patch: patches[0],
        outputs: [
          {
            to: [1],
            pinKey: 'OUT',
            value: 42,
          },
        ],
        inputs: [],
      },
      {
        id: 1,
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
      },
    ];
    project = {
      config,
      patches,
      nodes,
      topology: [0, 1],
    };
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
    const result = T.renderProgram(project.topology, nodes);
    assert.strictEqual(result, programFixture);
  });
});
