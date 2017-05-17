import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {
  fixture,
  expectRejectedWithCode,
} from './utils';
import * as U from '../src/utils';
import * as ERROR_CODES from '../src/errorCodes';
import { DEFAULT_WORKSPACE_PATH } from '../src/constants';

chai.use(chaiAsPromised);

describe('Utils', () => {
  it('ensureWorkspacePath: resolve path and homedir symbol', () => {
    assert.equal(U.ensureWorkspacePath('/Users/vaso/test'), '/Users/vaso/test');
    assert.equal(U.ensureWorkspacePath('~/xod'), U.resolvePath('~/xod'));
  });
  it('ensureWorkspacePath: fallback to default workspace path', () => {
    assert.equal(U.ensureWorkspacePath(''), U.resolvePath(DEFAULT_WORKSPACE_PATH));
    assert.equal(U.ensureWorkspacePath({}), U.resolvePath(DEFAULT_WORKSPACE_PATH));
    assert.equal(U.ensureWorkspacePath(null), U.resolvePath(DEFAULT_WORKSPACE_PATH));
  });

  it('resolveWorkspacePath: resolve Path for valid value',
    () => assert.eventually.equal(
      U.resolveWorkspacePath(fixture('./workspace')),
      fixture('./workspace')
    )
  );
  it('resolveWorkspacePath: reject INVALID_WORKSPACE_PATH for null value',
    () => expectRejectedWithCode(
      U.resolveWorkspacePath(null),
      ERROR_CODES.INVALID_WORKSPACE_PATH
    )
  );
  it('resolveWorkspacePath: reject INVALID_WORKSPACE_PATH for empty string',
    () => expectRejectedWithCode(
      U.resolveWorkspacePath(''),
      ERROR_CODES.INVALID_WORKSPACE_PATH
    )
  );

  it('isWorkspaceValid: resolve Path for valid workspace',
    () => assert.eventually.equal(
      U.isWorkspaceValid(fixture('./workspace')),
      fixture('./workspace')
    )
  );
  it('isWorkspaceValid: reject WORKSPACE_DIR_NOT_EMPTY for not empty directory',
    () => expectRejectedWithCode(
      U.isWorkspaceValid(fixture('./emptyWorkspace')),
      ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY
    )
  );
  it('isWorkspaceValid: reject WORKSPACE_DIR_NOT_EXIST_OR_EMPTY for non-existent directory',
    () => expectRejectedWithCode(
      U.isWorkspaceValid(fixture('./notExistWorkspace')),
      ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY
    )
  );

  it('validateWorkspace: resolve Path for valid workspace',
    () => assert.eventually.equal(
      U.validateWorkspace(fixture('./workspace')),
      fixture('./workspace')
    )
  );
  it('validateWorkspace: reject WORKSPACE_DIR_NOT_EXIST_OR_EMPTY for not existent directory',
    () => expectRejectedWithCode(
      U.validateWorkspace(fixture('./notExistWorkspace')),
      ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY
    )
  );
  it('validateWorkspace: reject WORKSPACE_DIR_NOT_EMPTY for not empty directory without workspace file',
    () => expectRejectedWithCode(
      U.validateWorkspace(fixture('.')),
      ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY
    )
  );
});
