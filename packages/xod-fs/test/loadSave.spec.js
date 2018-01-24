import path from 'path';
import fs from 'fs';
import os from 'os';

import R from 'ramda';
import dircompare from 'dir-compare';
import { assert } from 'chai';

import { defaultizeProject } from 'xod-project/test/helpers';

import { loadProject } from '../src/load';
import { saveAll } from '../src/save';

const fixture = subpath => path.resolve(__dirname, 'fixtures', subpath);

const formatDiffs = comparison => JSON.stringify(
  R.reject(
    R.propEq('state', 'equal'),
    comparison.diffSet
  ),
  null, 2
);

describe('Load/Save roundtrip', () => {
  it('preserves project files byte-by-byte', async () => {
    // load fixture project
    const emptyProject = defaultizeProject({});
    const project = await loadProject([fixture('workspace')], fixture('workspace/awesome-project'));

    // save it to a brand-new workspace
    const tmpDirPrefix = path.join(os.tmpdir(), 'xod-fs-test-');
    const tmpWorkspace = fs.mkdtempSync(tmpDirPrefix);
    await saveAll(tmpWorkspace, emptyProject, project);

    // compare source and destination directory contents
    const comparison = dircompare.compareSync(
      fixture('workspace/awesome-project'),
      path.join(tmpWorkspace, 'awesome-project'),
      {
        compareContent: true,
        excludeFilter: '.DS_Store,.directory,.Trash-*,Thumbs.db,desktop.ini',
      }
    );

    assert.equal(comparison.differences, 0, [
      'Fixture project and its resave differ:',
      formatDiffs(comparison),
    ].join('\n'));
  });
});
