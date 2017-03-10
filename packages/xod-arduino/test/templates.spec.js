import R from 'ramda';
import chai, { assert } from 'chai';
import chaiString from 'chai-string';
import * as T from '../src/templates';

import inputImpl from './fixtures/impl.input.cpp';

import configFixture from './fixtures/config.cpp';
import patchContextFixture from './fixtures/patchContext.cpp';
import implFixture from './fixtures/impl.cpp';
import implListFixture from './fixtures/implList.cpp';
import programFixture from './fixtures/program.cpp';
import programWithCustomValueFixture from './fixtures/program.customValue.cpp';
import projectFixture from './fixtures/project.cpp';

chai.use(chaiString);

describe('xod-arduino templates', () => {
  const config = {
    NODE_COUNT: 8,
    MAX_OUTPUT_COUNT: 3,
    XOD_DEBUG: false,
  };
  const patches = [
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
          pinKey: 'IN1',
        },
        {
          pinKey: 'IN2',
        },
      ],
      impl: inputImpl,
      isDirty: false,
    },
  ];
  const nodes = [
    {
      id: 0,
      patch: patches[0],
      outputs: [
        {
          to: [1],
          pinKey: 'OUT',
          value: null,
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
  const project = {
    config,
    patches,
    nodes,
    topology: [0, 1],
  };

  it('configuration should render properly', () => {
    const result = T.renderConfig(config);
    assert.equalIgnoreSpaces(result, configFixture);
  });

  it('patchContext should render properly', () => {
    const result = T.renderPatchContext(patches[0]);
    assert.equalIgnoreSpaces(result, patchContextFixture);
  });

  it('implementation should render properly', () => {
    const result = T.renderImpl(patches[0]);
    assert.equalIgnoreSpaces(result, implFixture);
  });

  it('implementation list should render properly', () => {
    const result = T.renderImplList(patches);
    assert.equalIgnoreSpaces(result, implListFixture);
  });

  it('program should render properly', () => {
    const result = T.renderProgram(project.topology, nodes);
    assert.equalIgnoreSpaces(result, programFixture);
  });

  it('value of pin from patch should be overwritten by value from node', () => {
    const nodePinValueLens = R.compose(
      R.lensIndex(0),
      R.lensProp('outputs'),
      R.lensIndex(0),
      R.lensProp('value')
    );
    const newNodes = R.set(nodePinValueLens, 5, nodes);
    const result = T.renderProgram(project.topology, newNodes);
    assert.equalIgnoreSpaces(result, programWithCustomValueFixture);
  });

  it('should render everything and glue parts properly', () => {
    const result = T.renderProject(project);
    assert.equalIgnoreSpaces(result, projectFixture);
  });
});
