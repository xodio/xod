import path from 'path';
import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { fixture, expectRejectedWithCode } from './utils';
import * as U from '../src/utils';
import * as ERROR_CODES from '../src/errorCodes';
import { DEFAULT_WORKSPACE_PATH } from '../src/constants';

chai.use(chaiAsPromised);

describe('Utils', () => {
  it('ensureWorkspacePath: if path correct, just resolves path', () => {
    assert.equal(U.ensureWorkspacePath('/Users/vaso/test'), '/Users/vaso/test');
    assert.equal(U.ensureWorkspacePath('a/b/c'), path.resolve('a/b/c'));
  });
  it('ensureWorkspacePath: if path begins with homedir symbol, resolves path to homedir', () => {
    assert.equal(U.ensureWorkspacePath('~/xod'), U.resolvePath('~/xod'));
  });
  it('ensureWorkspacePath: if path is empty or incorrect, fallbacks to default workspace path', () => {
    assert.equal(
      U.ensureWorkspacePath(''),
      U.resolvePath(DEFAULT_WORKSPACE_PATH)
    );
    assert.equal(
      U.ensureWorkspacePath({}),
      U.resolvePath(DEFAULT_WORKSPACE_PATH)
    );
    assert.equal(
      U.ensureWorkspacePath(null),
      U.resolvePath(DEFAULT_WORKSPACE_PATH)
    );
  });

  it('resolveWorkspacePath: if path correct, just resolves path', () =>
    assert.eventually.equal(
      U.resolveWorkspacePath(fixture('./workspace')),
      fixture('./workspace')
    ));
  it('resolveWorkspacePath: if path is incorrect, rejects with error code INVALID_WORKSPACE_PATH', () =>
    Promise.all([
      expectRejectedWithCode(
        U.resolveWorkspacePath(null),
        ERROR_CODES.INVALID_WORKSPACE_PATH
      ),
      expectRejectedWithCode(
        U.resolveWorkspacePath(''),
        ERROR_CODES.INVALID_WORKSPACE_PATH
      ),
    ]));

  it('isWorkspaceValid: if workspace in specified path is valid, resolves path', () =>
    assert.eventually.equal(
      U.isWorkspaceValid(fixture('./workspace')),
      fixture('./workspace')
    ));
  it('isWorkspaceValid: if specified directory is not empty, rejects with error code WORKSPACE_DIR_NOT_EMPTY', () =>
    expectRejectedWithCode(
      U.isWorkspaceValid(fixture('./notEmpty')),
      ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY
    ));
  it('isWorkspaceValid: if specified directory is not exist or empty, rejects with error code WORKSPACE_DIR_NOT_EXIST_OR_EMPTY', () =>
    expectRejectedWithCode(
      U.isWorkspaceValid(fixture('./notExistWorkspace')),
      ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY
    ));

  it('validateWorkspace: if workspace in specified path is valid, resolves path', () =>
    assert.eventually.equal(
      U.validateWorkspace(fixture('./workspace')),
      fixture('./workspace')
    ));
  it('validateWorkspace: if specified path is incorrect, rejects with error code INVALID_WORKSPACE_PATH', () =>
    expectRejectedWithCode(
      U.validateWorkspace(null),
      ERROR_CODES.INVALID_WORKSPACE_PATH
    ));
  it('validateWorkspace: if specified directory is not empty, rejects with error code WORKSPACE_DIR_NOT_EMPTY', () =>
    expectRejectedWithCode(
      U.validateWorkspace(fixture('.')),
      ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY
    ));
  it('validateWorkspace: if specified directory is not exist or empty, rejects with error code WORKSPACE_DIR_NOT_EXIST_OR_EMPTY', () =>
    expectRejectedWithCode(
      U.validateWorkspace(fixture('./notExistWorkspace')),
      ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY
    ));
});
