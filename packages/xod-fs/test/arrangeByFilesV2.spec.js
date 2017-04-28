import { assert } from 'chai';
import R from 'ramda';
import * as XP from 'xod-project';

import projectV2Fixture from './fixtures/projectV2.json';

import {
  arrangeByFilesV2,
  getProjectFileContents,
  getProjectPathV2,
  getPatchFolderName,
  getXodmContents,
  getXodpContents,
} from '../src/arrangeByFilesV2';

describe('arrangeByFilesV2 parts', () => {
  describe('getProjectFileContents', () => {
    it('should provide correct project.xod contents', () => {
      assert.deepEqual(
        getProjectFileContents(projectV2Fixture),
        {
          meta: {
            name: 'Awesome project',
            author: 'Author 1, Author 2',
          },
          libs: [
            'xod/core',
          ],
        }
      );
    });
  });

  describe('getProjectPathV2', () => {
    it('should convert project name to path', () => {
      assert.deepEqual(
        getProjectPathV2(projectV2Fixture),
        './awesome-project'
      );
    });
  });

  describe('getPatchFolderName', () => {
    it('should convert patch path to folder name', () => {
      assert.deepEqual(
        R.compose(
          R.map(getPatchFolderName),
          XP.listLocalPatches
        )(projectV2Fixture),
        ['Main']
      );
    });
  });

  describe('getXodmContents', () => {
    it('should convert patch to .xodm format', () => { // TODO: phrasing
      assert.deepEqual(
        R.compose(
          R.map(getXodmContents),
          XP.listLocalPatches
        )(projectV2Fixture),
        [{
          pins: {
            rJxbjrKpl: {
              description: 'My pin description',
              direction: 'input',
              index: 0,
              key: 'rJxbjrKpl',
              label: 'My pin label',
              pinLabel: 'My pin label',
              type: 'number',
            },
          },
        }]
      );
    });
  });

  describe('getXodpContents', () => {
    it('should convert patch to .xodp format', () => {
      assert.deepEqual(
        R.compose(
          R.map(getXodpContents),
          XP.listLocalPatches
        )(projectV2Fixture),
        [
          {
            links: {
              rJIWsrtae: {
                id: 'rJIWsrtae',
                pins: [
                  {
                    nodeId: 'SJmGlirFpx',
                    pinKey: 'brightness',
                  },
                  {
                    nodeId: 'rJxbjrKpl',
                    pinKey: 'PIN',
                  },
                ],
              },
            },
            nodes: {
              SJmGlirFpx: {
                id: 'SJmGlirFpx',
                pins: {
                  brightness: {
                    injected: false,
                    value: 0,
                  },
                },
                position: {
                  x: 138,
                  y: 224,
                },
                properties: {
                  label: 'my led',
                  description: 'description for my led',
                },
                typeId: 'xod/core/led',
              },
              rJxbjrKpl: {
                id: 'rJxbjrKpl',
                pins: {},
                position: {
                  x: 138,
                  y: 16,
                },
                properties: {
                  label: '',
                  description: '',
                },
                typeId: 'xod/core/inputNumber',
              },
            },
          },
        ]
      );
    });
  });
});

describe('arrangeByFilesV2 e2e', () => {
  it('should split v2 project into an array of files described as {path, content}', () => {
    assert.deepEqual(
      arrangeByFilesV2(projectV2Fixture),
      [
        {
          content: {
            libs: [
              'xod/core',
            ],
            meta: {
              author: 'Author 1, Author 2',
              name: 'Awesome project',
            },
          },
          path: './awesome-project/project.xod',
        },
        {
          content: {
            pins: {
              rJxbjrKpl: {
                description: 'My pin description',
                direction: 'input',
                index: 0,
                key: 'rJxbjrKpl',
                label: 'My pin label',
                pinLabel: 'My pin label',
                type: 'number',
              },
            },
          },
          path: './awesome-project/Main/patch.xodm',
        },
        {
          content: {
            links: {
              rJIWsrtae: {
                id: 'rJIWsrtae',
                pins: [
                  {
                    nodeId: 'SJmGlirFpx',
                    pinKey: 'brightness',
                  },
                  {
                    nodeId: 'rJxbjrKpl',
                    pinKey: 'PIN',
                  },
                ],
              },
            },
            nodes: {
              SJmGlirFpx: {
                id: 'SJmGlirFpx',
                pins: {
                  brightness: {
                    injected: false,
                    value: 0,
                  },
                },
                position: {
                  x: 138,
                  y: 224,
                },
                properties: {
                  label: 'my led',
                  description: 'description for my led',
                },
                typeId: 'xod/core/led',
              },
              rJxbjrKpl: {
                id: 'rJxbjrKpl',
                pins: {},
                position: {
                  x: 138,
                  y: 16,
                },
                properties: {
                  label: '',
                  description: '',
                },
                typeId: 'xod/core/inputNumber',
              },
            },
          },
          path: './awesome-project/Main/patch.xodp',
        },
      ]
    );
  });
});
