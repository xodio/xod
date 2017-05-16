import { assert } from 'chai';
import path from 'path';
import fs from 'fs-extra';

import { spawnWorkspaceFile, spawnStdLib, spawnDefaultProject } from '../src/spawn';
import { isFileExist, isDirectoryExist } from '../src/utils';

describe('Spawn', () => {
  const fixture = p => path.resolve(__dirname, 'fixtures', p);
  const deleteAfter = (p) => {
    after(() => fs.remove(fixture(p)));
  };

  it('spawnWorkspaceFile resolves to workspace path on success', () => {
    deleteAfter('./new-workspace');
    return spawnWorkspaceFile(fixture('./new-workspace'))
      .then((p) => {
        assert.equal(p, fixture('./new-workspace'));
        assert.ok(isFileExist(fixture('./new-workspace/.xodworkspace')));
      });
  });

  it('spawnStdLib resolves to workspace path on success', () => {
    deleteAfter('./new-workspace');
    return spawnStdLib(fixture('./workspace/lib'), fixture('./new-workspace'))
      .then(() => {
        assert.ok(isDirectoryExist(fixture('./new-workspace/lib')));
        fs.readdir(fixture('./new-workspace/lib'), (err, files) => {
          assert.lengthOf(files, 2);
          assert.includeMembers(files, ['xod', 'user']);
        });
      });
  });

  it('spawnDefaultProject resolves to workspace path on success', () => {
    deleteAfter('./new-workspace');
    return spawnDefaultProject(fixture('./workspace/awesome-project'), fixture('./new-workspace'))
      .then(() => {
        assert.ok(isDirectoryExist(fixture('./new-workspace/welcome-to-xod')));
        fs.readdir(fixture('./new-workspace/welcome-to-xod'), (err, files) => {
          assert.lengthOf(files, 3);
          assert.includeMembers(files, ['project.xod', 'main', 'qux']);
        });
      });
  });
});
