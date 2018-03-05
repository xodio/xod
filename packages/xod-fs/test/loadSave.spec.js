import path from 'path';
import fs from 'fs-extra';
import os from 'os';

import R from 'ramda';
import dircompare from 'dir-compare';
import { assert } from 'chai';

import { explodeEither } from 'xod-func-tools';
import * as XP from 'xod-project';
import { defaultizeProject } from 'xod-project/test/helpers';

import { loadProject, loadProjectFromXodball } from '../src/load';
import { saveAll, saveProjectAsXodball } from '../src/save';

const fixture = subpath => path.resolve(__dirname, 'fixtures', subpath);

const formatDiffs = comparison =>
  JSON.stringify(
    R.reject(R.propEq('state', 'equal'), comparison.diffSet),
    null,
    2
  );

describe('Load/Save roundtrip', () => {
  afterEach(() =>
    Promise.all([fs.remove(fixture('new')), fs.remove(fixture('new.xodball'))])
  );

  it('preserves project files byte-by-byte', async () => {
    // load fixture project
    const emptyProject = defaultizeProject({});
    const project = await loadProject(
      [fixture('workspace')],
      fixture('workspace/awesome-project')
    );

    // save it to a brand-new workspace
    const tmpDirPrefix = path.join(os.tmpdir(), 'xod-fs-test-');
    const tmpWorkspace = fs.mkdtempSync(tmpDirPrefix);
    const tmpProject = path.join(tmpWorkspace, 'awesome-project');
    await saveAll(tmpWorkspace, tmpProject, emptyProject, project);

    // compare source and destination directory contents
    const comparison = dircompare.compareSync(
      fixture('workspace/awesome-project'),
      tmpProject,
      {
        compareContent: true,
        excludeFilter: '.DS_Store,.directory,.Trash-*,Thumbs.db,desktop.ini',
      }
    );

    assert.equal(
      comparison.differences,
      0,
      ['Fixture project and its resave differ:', formatDiffs(comparison)].join(
        '\n'
      )
    );
  });
  it('xodball -> multifile, multifile -> xodball', async () => {
    const emptyProject = defaultizeProject({});

    const projectFromXodball = await loadProjectFromXodball(
      [fixture('workspace')],
      fixture('some.xodball')
    );
    await saveAll(
      fixture('workspace'),
      fixture('new'),
      emptyProject,
      projectFromXodball
    );

    const projectFromMulti = await loadProject(
      [fixture('workspace')],
      fixture('new')
    );
    await saveProjectAsXodball(fixture('new.xodball'), projectFromMulti);

    const filesToCompare = await Promise.all([
      fs.readFile(fixture('some.xodball'), 'utf8').then(JSON.parse),
      fs.readFile(fixture('new.xodball'), 'utf8').then(JSON.parse),
    ]);

    assert.deepEqual(filesToCompare[0], filesToCompare[1]);
  });
  it('multifile -> xodball, xodball -> multifile', async () => {
    const emptyProject = defaultizeProject({});

    const projectFromMultifile = await loadProject(
      [fixture('workspace')],
      fixture('workspace/awesome-project')
    );
    await saveProjectAsXodball(fixture('new.xodball'), projectFromMultifile);

    const projectFromXodball = await loadProject(
      [fixture('workspace')],
      fixture('new.xodball')
    );
    await saveAll(
      fixture('workspace'),
      fixture('new'),
      emptyProject,
      projectFromXodball
    );

    // compare source and destination directory contents
    const comparison = dircompare.compareSync(
      fixture('workspace/awesome-project'),
      fixture('new'),
      {
        compareContent: true,
        excludeFilter: '.DS_Store,.directory,.Trash-*,Thumbs.db,desktop.ini',
      }
    );

    assert.equal(
      comparison.differences,
      0,
      ['Fixture project and its resave differ:', formatDiffs(comparison)].join(
        '\n'
      )
    );
  });

  // NodePosition :: { x :: Number, y :: Number }
  // :: NodePosition -> NodeId -> PatchPath -> Project -> Project
  const moveNode = R.curry((position, nodeId, patchPath, project) =>
    R.compose(
      explodeEither,
      XP.updatePatch(patchPath, patch =>
        R.compose(
          XP.assocNode(R.__, patch),
          XP.setNodePosition(position),
          XP.getNodeByIdUnsafe(nodeId)
        )(patch)
      )
    )(project)
  );

  it('xodball -> move -> xodball -> counter-move -> xodball', async () => {
    const projectFromXodball = await loadProjectFromXodball(
      [fixture('workspace')],
      fixture('some.xodball')
    );

    const originalNodePosition = R.compose(
      XP.getNodePosition,
      XP.getNodeByIdUnsafe('2c03e470-fefd-4f58-be6a-58d209d9158c'),
      XP.getPatchByPathUnsafe('@/main')
    )(projectFromXodball);

    const changedProject = moveNode(
      { x: 4200, y: 4200 },
      '2c03e470-fefd-4f58-be6a-58d209d9158c',
      '@/main',
      projectFromXodball
    );

    await saveAll(
      fixture('workspace'),
      fixture('new.xodball'),
      projectFromXodball,
      changedProject
    );

    const projectFromXodball2 = await loadProjectFromXodball(
      [fixture('workspace')],
      fixture('new.xodball')
    );

    const changedProject2 = moveNode(
      originalNodePosition,
      '2c03e470-fefd-4f58-be6a-58d209d9158c',
      '@/main',
      projectFromXodball
    );

    await saveAll(
      fixture('workspace'),
      fixture('new.xodball'),
      projectFromXodball2,
      changedProject2
    );

    const filesToCompare = await Promise.all([
      fs.readFile(fixture('some.xodball'), 'utf8').then(JSON.parse),
      fs.readFile(fixture('new.xodball'), 'utf8').then(JSON.parse),
    ]);

    assert.deepEqual(filesToCompare[0], filesToCompare[1]);
  });

  it('multifile -> move -> multifile -> counter-move -> multifile', async () => {
    const projectFromMultifile = await loadProject(
      [fixture('workspace')],
      fixture('workspace/awesome-project')
    );

    const originalNodePosition = R.compose(
      XP.getNodePosition,
      XP.getNodeByIdUnsafe('2c03e470-fefd-4f58-be6a-58d209d9158c'),
      XP.getPatchByPathUnsafe('@/main')
    )(projectFromMultifile);

    const changedProject = moveNode(
      { x: 4200, y: 4200 },
      '2c03e470-fefd-4f58-be6a-58d209d9158c',
      '@/main',
      projectFromMultifile
    );

    await saveAll(
      fixture('workspace'),
      fixture('new'),
      projectFromMultifile,
      changedProject
    );

    const projectFromMultifile2 = await loadProject(
      [fixture('workspace')],
      fixture('new')
    );

    const changedProject2 = moveNode(
      originalNodePosition,
      '2c03e470-fefd-4f58-be6a-58d209d9158c',
      '@/main',
      projectFromMultifile
    );

    await saveAll(
      fixture('workspace'),
      fixture('new'),
      projectFromMultifile2,
      changedProject2
    );

    // compare source and destination directory contents
    const comparison = dircompare.compareSync(
      fixture('workspace/awesome-project'),
      fixture('new'),
      {
        compareContent: true,
        excludeFilter: '.DS_Store,.directory,.Trash-*,Thumbs.db,desktop.ini',
      }
    );

    assert.equal(
      comparison.differences,
      0,
      ['Fixture project and its resave differ:', formatDiffs(comparison)].join(
        '\n'
      )
    );
  });
});
