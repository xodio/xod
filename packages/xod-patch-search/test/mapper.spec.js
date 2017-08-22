import { assert } from 'chai';
import { listPatchesWithoutBuiltIns } from 'xod-project';
import { defaultizeProject } from 'xod-project/test/helpers';

import createPatchIndexData from '../src/mapper';

describe('xod-patch-search/mapper', () => {
  const fixture = {
    patches: {
      'xod/core/constant-number': {
        path: 'xod/core/constant-number',
        description: 'Outputs a constant number value',
        attachments: [{
          filename: 'README.md',
          encoding: 'utf8',
          content: '#Constant-number node \n\n It sends a constant number once on the start of programm to all links connected to its only one output.',
        }],
      },
      'xod/core/multiply': {
        path: 'xod/core/multiply',
        description: 'Outputs a product of two numbers',
        attachments: [],
      },
      'xod/units/m-to-cm': {
        path: 'xod/units/m-to-cm',
        description: 'Maps meters to centimeters',
        attachments: [],
      },
    },
  };
  const project = defaultizeProject(fixture);

  it('returns a correct index data', () => {
    const patches = listPatchesWithoutBuiltIns(project);
    const indexData = createPatchIndexData(patches);

    assert.lengthOf(indexData, 3);
    assert.deepEqual(indexData[0], {
      path: 'xod/core/constant-number',
      lib: 'xod/core',
      keywords: ['constant', 'number'],
      description: fixture.patches['xod/core/constant-number'].description,
      fullDescription: fixture.patches['xod/core/constant-number'].attachments[0].content,
    });
    assert.deepEqual(indexData[1], {
      path: 'xod/core/multiply',
      lib: 'xod/core',
      keywords: ['multiply'],
      description: fixture.patches['xod/core/multiply'].description,
      fullDescription: '',
    });
    assert.deepEqual(indexData[2], {
      path: 'xod/units/m-to-cm',
      lib: 'xod/units',
      keywords: ['m', 'cm'],
      description: fixture.patches['xod/units/m-to-cm'].description,
      fullDescription: '',
    });
  });
});
