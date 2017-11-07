import { assert } from 'chai';
import fs from 'fs-extra';

import { spawnWorkspaceFile, spawnDefaultProject } from '../src/spawn';
import { doesFileExist, doesDirectoryExist } from '../src/utils';
import * as ERROR_CODES from '../src/errorCodes';

import { fixture, expectRejectedWithCode } from './utils';

describe('Spawn', () => {
  it('spawnWorkspaceFile resolves to workspace path on success', () => {
    after(() => fs.remove(fixture('./new-workspace')));
    return spawnWorkspaceFile(fixture('./new-workspace')).then(p => {
      assert.equal(p, fixture('./new-workspace'));
      assert.ok(doesFileExist(fixture('./new-workspace/.xodworkspace')));
    });
  });

  it('spawnDefaultProject resolves to workspace path on success', () => {
    after(() => fs.remove(fixture('./new-workspace')));
    return spawnDefaultProject(
      fixture('./workspace/awesome-project'),
      fixture('./new-workspace')
    ).then(() => {
      assert.ok(doesDirectoryExist(fixture('./new-workspace/welcome-to-xod')));
      fs.readdir(fixture('./new-workspace/welcome-to-xod'), (err, files) => {
        assert.includeMembers(files, ['project.xod', 'main', 'qux']);
      });
    });
  });
  it('spawnDefaultProject rejects CANT_COPY_DEFAULT_PROJECT on failure', () =>
    expectRejectedWithCode(
      spawnDefaultProject(
        fixture('./no-dir/no-proj'),
        fixture('./new-workspace')
      ),
      ERROR_CODES.CANT_COPY_DEFAULT_PROJECT
    ));
});
