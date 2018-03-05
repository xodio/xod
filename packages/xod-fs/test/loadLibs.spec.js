import R from 'ramda';
import { assert } from 'chai';

import path from 'path';
import { loadLibrary, loadLibs } from '../src/loadLibs';
import { resolveLibPath } from '../src/utils';

const workspaceDir = './fixtures/workspace';

describe('Library loader', () => {
  const workspace = path.resolve(__dirname, workspaceDir);
  const libDir = resolveLibPath(workspace);

  it('should load xod/core libs from ./fixtures/workspace/lib', () => {
    loadLibrary(['xod/core'], libDir).then(libs => {
      assert.sameMembers(R.keys(libs), [
        'xod/core/and',
        'xod/core/led',
        'xod/core/pot',
        'xod/core/test',
      ]);
    });
  });

  it('should load all libs from ./fixtures/workspace/lib', () =>
    loadLibs([libDir]).then(libs => {
      assert.sameMembers(R.keys(libs), [
        'user/utils/test',
        'user/with-omitted-optionals/empty-lib-patch',
        'user/with-omitted-optionals/optional-node-fields-omitted',
        'xod/core/and',
        'xod/core/led',
        'xod/core/pot',
        'xod/core/test',
        'xod/math/test',
      ]);
    }));

  it('loads libraries from bundled workspace and ./fixtures/workspace with highest priority', () => {
    const bundledLibDir = resolveLibPath(
      path.resolve(__dirname, '../../../workspace')
    );
    return loadLibs([libDir, bundledLibDir]).then(libs => {
      const libPatchPaths = R.keys(libs);

      // Check that libs is loaded
      assert.includeMembers(libPatchPaths, [
        // from fixture workspace
        'user/utils/test',
        'user/with-omitted-optionals/empty-lib-patch',
        'user/with-omitted-optionals/optional-node-fields-omitted',
        'xod/core/and',
        'xod/core/led',
        'xod/core/pot',
        'xod/core/test',
        'xod/math/test',
        // from bundled workspace
        'xod/bits/dec-to-bcd',
        'xod/bits/shift-left',
      ]);

      // Check that libs, that exists in fixture workspace,
      // does not loaded from bundled workspace
      assert.notIncludeMembers(libPatchPaths, [
        'xod/core/buffer',
        'xod/core/absolute',
      ]);
    });
  });
});
