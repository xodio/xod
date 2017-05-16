import { assert } from 'chai';

import * as U from '../src/utils';
import { DEFAULT_WORKSPACE_PATH } from '../src/constants';

describe('xod-fs utils', () => {
  it('ensureWorkspacePath: resolve path and homedir symbol', () => {
    assert.equal(U.ensureWorkspacePath('/Users/vaso/test'), '/Users/vaso/test');
    assert.equal(U.ensureWorkspacePath('~/xod'), U.resolvePath('~/xod'));
  });
  it('ensureWorkspacePath: fallback to default workspace path', () => {
    assert.equal(U.ensureWorkspacePath(''), U.resolvePath(DEFAULT_WORKSPACE_PATH));
    assert.equal(U.ensureWorkspacePath({}), U.resolvePath(DEFAULT_WORKSPACE_PATH));
    assert.equal(U.ensureWorkspacePath(null), U.resolvePath(DEFAULT_WORKSPACE_PATH));
  });
});
