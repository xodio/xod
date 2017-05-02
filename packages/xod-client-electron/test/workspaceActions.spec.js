import { assert } from 'chai';
import { resolve } from 'path';
import fs from 'fs';
import { isFileExists, isDirectoryExists, rmrf } from 'xod-fs';

import { WORKSPACE_FILENAME, LIBS_FOLDERNAME, DEFAULT_PROJECT_NAME } from '../src/app/constants';
import * as WA from '../src/app/workspaceActions';
import * as ERROR_CODES from '../src/app/errorCodes';

const PATH = {
  FIXTURES: resolve(__dirname, './fixtures'),
  WORKSPACE: resolve(__dirname, './fixtures/validWorkspace'),
  NOT_EXIST: resolve(__dirname, './fixtures/notExist'),
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
  const testFile = resolve(PATH.NOT_EXIST, WORKSPACE_FILENAME);
  const deleteFolder = () => rmrf(PATH.NOT_EXIST);

  beforeEach(deleteFolder);
  afterEach(deleteFolder);

  it('Promise.Resolved Path for successfull spawning', (done) => {
    WA.spawnWorkspaceFile(PATH.NOT_EXIST).then((path) => {
      const filePath = resolve(path, WORKSPACE_FILENAME);
      assert.equal(testFile, filePath);
      assert.equal(isFileExists(filePath), true);
      done();
    });
  });

  // TODO: Add test for Promise.Rejected Error somehow
});

describe('spawnStdLib', () => {
  const destFolder = resolve(PATH.NOT_EXIST, LIBS_FOLDERNAME);
  const deleteFolder = () => rmrf(PATH.NOT_EXIST);

  beforeEach(deleteFolder);
  afterEach(deleteFolder);

  it('Promise.Resolved Path for successfull spawnking', (done) => {
    WA.spawnStdLib(PATH.NOT_EXIST).then(() => {
      assert.equal(isDirectoryExists(destFolder), true);
      fs.readdir(destFolder, (err, files) => {
        assert.isAbove(files.length, 0);
        assert.includeMembers(files, ['xod']);
        done();
      });
    });
  });

  // TODO: Add test for Promise.Rejected Error somehow
});

describe('spawnDefaultProject', () => {
  const destFolder = resolve(PATH.NOT_EXIST, DEFAULT_PROJECT_NAME);
  const deleteFolder = () => rmrf(PATH.NOT_EXIST);

  beforeEach(deleteFolder);
  afterEach(deleteFolder);

  it('Promise.Resolved Path for successfull spawnking', (done) => {
    WA.spawnDefaultProject(PATH.NOT_EXIST).then(() => {
      assert.equal(isDirectoryExists(destFolder), true);
      fs.readdir(destFolder, (err, files) => {
        assert.isAbove(files.length, 0);
        assert.includeMembers(files, ['project.xod', 'main']);
        done();
      });
    });
  });

  // TODO: Add test for Promise.Rejected Error somehow
});

describe('enumerateProjects', () => {
  it('Promise.Resolve ProjectMeta for valid workspace', (done) => {
    WA.enumerateProjects(PATH.WORKSPACE).then((projects) => {
      assert.isAbove(projects.length, 0);
      done();
    });
  });
  it('Promise.Reject Error CANT_ENUMERATE_PROJECTS', (done) => {
    const errCode = ERROR_CODES.CANT_ENUMERATE_PROJECTS;
    WA.enumerateProjects(PATH.NOT_EXIST).catch((err) => {
      assert.equal(errCode, err.errorCode);
      done();
    });
  });
});

describe('filterLocalProjects', () => {
  const libProjectMeta = { path: 'a/b/c/lib/xod/core' };
  const welcomeProjectMeta = { path: 'a/b/c/welcome' };

  it('should return only local projects', () => {
    const filtered = WA.filterLocalProjects('a/b/c', [libProjectMeta, welcomeProjectMeta]);
    assert.lengthOf(filtered, 1);
    assert.equal(filtered[0], welcomeProjectMeta);
  });
  it('should return empty list if there is no local projects', () => {
    const filtered = WA.filterLocalProjects('a/b/c', [libProjectMeta]);
    assert.lengthOf(filtered, 0);
  });
});

describe('spawn workspace end-to-end', () => {
  const deleteFolder = () => rmrf(PATH.NOT_EXIST);

  beforeEach(deleteFolder);
  afterEach(deleteFolder);

  it('It should spawn everything and enumerate all projects (including libs)', (done) => {
    Promise.resolve(PATH.NOT_EXIST)
      .then(WA.spawnWorkspaceFile)
      .then(WA.spawnStdLib)
      .then(WA.spawnDefaultProject)
      .then(WA.enumerateProjects)
      .then((projects) => {
        assert.isAbove(projects.length, 1);
        done();
      });
  });
});
