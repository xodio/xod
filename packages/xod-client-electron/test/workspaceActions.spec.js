import { assert } from 'chai';
import { resolve } from 'path';
import fs from 'fs';
import { isFileExists } from 'xod-fs';

import { WORKSPACE_FILENAME } from '../src/app/constants';
import * as WA from '../src/app/workspaceActions';
import * as ERROR_CODES from '../src/app/errorCodes';

const PATH = {
  FIXTURES: resolve(__dirname, './fixtures'),
  WORKSPACE: resolve(__dirname, './fixtures/validWorkspace'),
  NOT_EXIST: resolve(__dirname, './fixtures/notExist'),
  INVALID_PATH: resolve(__dirname, './::::/'),
};

describe('validatePath', () => {
  it('Promise.Resolved Path for valid value', (done) => {
    WA.validatePath(PATH.WORKSPACE).then((path) => {
      assert.equal(PATH.WORKSPACE, path);
      done();
    });
  });
  it('Promise.Rejected ERROR_CODE for null value', (done) => {
    const errCode = ERROR_CODES.INVALID_WORKSPACE_PATH;
    WA.validatePath(null).catch((err) => {
      assert.equal(errCode, err.errorCode);
      done();
    });
  });
  it('Promise.Rejected INVALID_WORKSPACE_PATH for empty string', (done) => {
    const errCode = ERROR_CODES.INVALID_WORKSPACE_PATH;
    WA.validatePath('').catch((err) => {
      assert.equal(errCode, err.errorCode);
      done();
    });
  });
});

describe('validateWorkspace', () => {
  it('Promise.Resolved Path for valid workspace', (done) => {
    WA.validateWorkspace(PATH.WORKSPACE).then((validPath) => {
      assert.equal(validPath, PATH.WORKSPACE);
      done();
    });
  });
  it('Promise.Rejected Error WORKSPACE_DIR_NOT_EXIST for not existent directory', (done) => {
    const errCode = ERROR_CODES.WORKSPACE_DIR_NOT_EXIST;
    WA.validateWorkspace(PATH.NOT_EXIST).catch((err) => {
      assert.equal(errCode, err.errorCode);
      done();
    });
  });
  it('Promise.Rejected Error WORKSPACE_DIR_NOT_EMPTY for not empty directory without workspace file', (done) => {
    const errCode = ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY;
    WA.validateWorkspace(PATH.FIXTURES)
    .catch((err) => {
      assert.equal(errCode, err.errorCode);
      done();
    });
  });
});

describe('spawnWorkspaceFile', () => {
  const testFile = resolve(PATH.FIXTURES, WORKSPACE_FILENAME);
  const deleteFile = () => { if (isFileExists(testFile)) fs.unlinkSync(testFile); };

  beforeEach(deleteFile);
  afterEach(deleteFile);

  it('Promise.Resolved Path for successfull spawning', (done) => {
    WA.spawnWorkspaceFile(PATH.FIXTURES).then((path) => {
      const filePath = resolve(path, WORKSPACE_FILENAME);
      assert.equal(testFile, filePath);
      assert.equal(isFileExists(filePath), true);
      done();
    });
  });
});
