import { assert } from 'chai';

import simpleProject from './fixtures/simple-project.json';

import {
  arrangeByFiles,
} from '../src/unpack';

describe('arrangeByFiles', () => {
  it('should split a project into an array of files described as {path, content}', () => {
    assert.deepEqual(
      arrangeByFiles(simpleProject),
      [
        {
          content: {
            authors: [
              'Author 1',
              'Author 2',
            ],
            description: '',
            libs: [
              'xod/core',
            ],
            license: '',
            version: '0.0.1',
            name: 'awesome-project',
          },
          path: './awesome-project/project.xod',
        },
        {
          content: {
            nodes: [
              {
                id: 'SJmGlirFpx',
                type: 'xod/core/led',
                position: {
                  x: 138,
                  y: 224,
                },
                pins: {
                  brightness: {
                    key: 'brightness',
                    value: 0,
                  },
                },
                label: 'my led',
                description: 'description for my led',
              },
              {
                id: 'rJxbjrKpl',
                type: 'xod/patch-nodes/input-number',
                position: {
                  x: 138,
                  y: 16,
                },
                pins: {},
                label: '',
                description: '',
              },
            ],
            links: [
              {
                id: 'rJIWsrtae',
                output: {
                  nodeId: 'rJxbjrKpl',
                  pinKey: 'PIN',
                },
                input: {
                  nodeId: 'SJmGlirFpx',
                  pinKey: 'brightness',
                },
              },
            ],
            description: 'main patch description',
          },
          path: './awesome-project/main/patch.xodp',
        },
        {
          content: '//custom implementation by user to work faster on Arduino',
          path: './awesome-project/main/arduino.cpp',
        },
      ]
    );
  });
});
