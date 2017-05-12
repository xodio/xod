import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { resolve } from 'path';
import fs from 'fs';
import { isFileExist, isDirectoryExist, rmrf } from 'xod-fs';
import { getProjectName } from 'xod-project';

import {
  WORKSPACE_FILENAME,
  LIBS_FOLDERNAME,
  DEFAULT_PROJECT_NAME,
} from '../src/app/constants';
import * as WA from '../src/app/workspaceActions';
import * as ERROR_CODES from '../src/shared/errorCodes';
import * as EVENTS from '../src/shared/events';

chai.use(chaiAsPromised);

const PATH = {
  FIXTURES: resolve(__dirname, './fixtures'),
  VALID_WORKSPACE: resolve(__dirname, './fixtures/validWorkspace'),
  EMPTY_WORKSPACE: resolve(__dirname, './fixtures/emptyWorkspace'),
  NOT_EXIST: resolve(__dirname, './fixtures/notExist'),
};

describe('Utils', () => {
  const deleteFolder = () => rmrf(PATH.NOT_EXIST);
  beforeEach(deleteFolder);
  afterEach(deleteFolder);

  describe('resolveWorkspacePath', () => {
    it('Promise.Resolved Path for valid value', (done) => {
      WA.resolveWorkspacePath(PATH.VALID_WORKSPACE).then((path) => {
        assert.equal(PATH.VALID_WORKSPACE, path);
        done();
      });
    });
    it('Promise.Rejected ERROR_CODE for null value', (done) => {
      const errCode = ERROR_CODES.INVALID_WORKSPACE_PATH;
      WA.resolveWorkspacePath(null).catch((err) => {
        assert.equal(errCode, err.errorCode);
        done();
      });
    });
    it('Promise.Rejected INVALID_WORKSPACE_PATH for empty string', (done) => {
      const errCode = ERROR_CODES.INVALID_WORKSPACE_PATH;
      WA.resolveWorkspacePath('').catch((err) => {
        assert.equal(errCode, err.errorCode);
        done();
      });
    });
  });

  describe('isWorkspaceValid', () => {
    it(
      'valid workspace: return Promise.Resolved Path',
      () => assert.eventually.equal(WA.isWorkspaceValid(PATH.VALID_WORKSPACE), PATH.VALID_WORKSPACE)
    );
    it(
      'empty workspace: return Promise.Rejected Error WORKSPACE_DIR_NOT_EMPTY',
      () => expect(WA.isWorkspaceValid(PATH.EMPTY_WORKSPACE))
        .to.eventually.be.rejected
        .and.have.property('errorCode', ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY)
    );
    it(
      'not existent workspace: return Promise.Rejected Error WORKSPACE_DIR_NOT_EXIST_OR_EMPTY',
      () => expect(WA.isWorkspaceValid(PATH.NOT_EXIST))
        .to.eventually.be.rejected
        .and.have.property('errorCode', ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY)
    );
  });

  describe('validateWorkspace', () => {
    it('Promise.Resolved Path for valid workspace', (done) => {
      WA.validateWorkspace(PATH.VALID_WORKSPACE).then((validPath) => {
        assert.equal(validPath, PATH.VALID_WORKSPACE);
        done();
      });
    });
    it('Promise.Rejected Error WORKSPACE_DIR_NOT_EXIST_OR_EMPTY for not existent directory', (done) => {
      const errCode = ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY;
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

    it('Promise.Resolved Path for successfull spawning', (done) => {
      WA.spawnWorkspaceFile(PATH.NOT_EXIST).then((path) => {
        const filePath = resolve(path, WORKSPACE_FILENAME);
        assert.equal(testFile, filePath);
        assert.equal(isFileExist(filePath), true);
        done();
      });
    });

    // TODO: Add test for Promise.Rejected Error somehow
  });

  describe('spawnStdLib', () => {
    const destFolder = resolve(PATH.NOT_EXIST, LIBS_FOLDERNAME);

    it('Promise.Resolved Path for successfull spawnking', (done) => {
      WA.spawnStdLib(PATH.NOT_EXIST).then(() => {
        assert.equal(isDirectoryExist(destFolder), true);
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

    it('Promise.Resolved Path for successfull spawnking', (done) => {
      WA.spawnDefaultProject(PATH.NOT_EXIST).then(() => {
        assert.equal(isDirectoryExist(destFolder), true);
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
      WA.enumerateProjects(PATH.VALID_WORKSPACE).then((projects) => {
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
});

describe('End-to-End', () => {
  const deleteTestFiles = () => Promise.all([
    rmrf(PATH.NOT_EXIST),
    rmrf(resolve(PATH.EMPTY_WORKSPACE, DEFAULT_PROJECT_NAME)),
    rmrf(resolve(PATH.EMPTY_WORKSPACE, LIBS_FOLDERNAME)),
  ]);

  beforeEach(deleteTestFiles);
  afterEach(deleteTestFiles);

  const loadMock = path => () => Promise.resolve(path);
  const saveMock = expectedPath => (actualPath) => {
    assert.equal(expectedPath, actualPath);
    return actualPath;
  };
  const sendMockDefault = (eventName, data) => {
    assert.oneOf(eventName, [
      EVENTS.UPDATE_WORKSPACE,
      EVENTS.REQUEST_SELECT_PROJECT,
    ]);
    if (eventName === EVENTS.REQUEST_SELECT_PROJECT) {
      assert.equal(data[0].meta.name, DEFAULT_PROJECT_NAME);
    }
  };

  describe('spawn workspace pipeline', () => {
    it('should spawn everything and enumerate all projects (not libs)', (done) => {
      Promise.resolve(PATH.NOT_EXIST)
        .then(WA.spawnWorkspaceFile)
        .then(WA.spawnStdLib)
        .then(WA.spawnDefaultProject)
        .then(WA.enumerateProjects)
        .then((projects) => {
          assert.lengthOf(projects, 1);
          done();
        });
    });
  });

  describe('onIDELaunch', () => {
    it('valid workspace with local project: should request User to select project', (done) => {
      WA.onIDELaunch(sendMockDefault, loadMock(PATH.VALID_WORKSPACE), saveMock(PATH.VALID_WORKSPACE))
        .then(() => done());
    });
    it('not exist workspace: should spawn workspace in homedir, spawn default project and request to open it', (done) => {
      WA.onIDELaunch(sendMockDefault, loadMock(PATH.NOT_EXIST), saveMock(PATH.NOT_EXIST))
        .then(() => done());
    });
  });

  describe('onSwitchWorkspace', () => {
    it('valid workspace: Promise.Resolved ProjectMeta[]', (done) => {
      WA.onSwitchWorkspace(sendMockDefault, saveMock(PATH.VALID_WORKSPACE), PATH.VALID_WORKSPACE)
        .then(() => done());
    });
    it('not existent workspace: requet User to confirm creation', (done) => {
      const sendMock = (eventName, { path, force }) => {
        assert.equal(eventName, EVENTS.REQUEST_CREATE_WORKSPACE);
        assert.equal(path, PATH.NOT_EXIST);
        assert.isFalse(force);
      };
      WA.onSwitchWorkspace(sendMock, saveMock(PATH.NOT_EXIST), PATH.NOT_EXIST)
        .then(() => done());
    });
    it('not empty folder: request User to confirm forced creation', (done) => {
      const sendMock = (eventName, { path, force }) => {
        assert.equal(eventName, EVENTS.REQUEST_CREATE_WORKSPACE);
        assert.equal(path, PATH.FIXTURES);
        assert.isTrue(force);
      };
      WA.onSwitchWorkspace(sendMock, saveMock(PATH.FIXTURES), PATH.FIXTURES)
        .then(() => done());
    });
  });

  describe('onOpenProject', () => {
    it('valid workspace: Promise.Resolved ProjectMeta[]', (done) => {
      WA.onOpenProject(sendMockDefault, loadMock(PATH.VALID_WORKSPACE))
        .then(() => done());
    });
    it('invalid workspace: show error and request to change workspace', (done) => {
      const sendMock = (eventName, err) => {
        assert.equal(eventName, EVENTS.WORKSPACE_ERROR);
        assert.equal(err.errorCode, ERROR_CODES.CANT_ENUMERATE_PROJECTS);
      };
      WA.onOpenProject(sendMock, loadMock(PATH.NOT_EXIST)).catch(() => done());
    });
    it('empty workspace: spawn default project and request to open it', (done) => {
      WA.onOpenProject(sendMockDefault, loadMock(PATH.EMPTY_WORKSPACE)).then(() => done());
    });
  });

  describe('onCreateProject', () => {
    const deleteTestProject = () => rmrf(resolve(PATH.EMPTY_WORKSPACE, 'test'));
    beforeEach(deleteTestProject);
    afterEach(deleteTestProject);

    it('should create, save and request to open new project', (done) => {
      const sendMock = (eventName, projectMeta) => {
        assert.equal(eventName, EVENTS.REQUEST_SHOW_PROJECT);
        assert.equal(projectMeta.meta.name, 'test');
      };
      WA.onCreateProject(sendMock, loadMock(PATH.EMPTY_WORKSPACE), 'test')
        .then(() => done());
    });
  });

  describe('onSelectProject', () => {
    it('valid workspace and projectMeta: load project and request opening it in renderer', (done) => {
      const sendMock = (eventName, project) => {
        assert.equal(eventName, EVENTS.REQUEST_SHOW_PROJECT);
        assert.equal(getProjectName(project), DEFAULT_PROJECT_NAME);
      };
      WA.onSelectProject(
        sendMock,
        loadMock(PATH.VALID_WORKSPACE),
        { path: resolve(PATH.VALID_WORKSPACE, DEFAULT_PROJECT_NAME) }
      ).then(() => done());
    });
    it('invalid workspace but valid projectMeta: show error and ask to change workspace', (done) => {
      // it could be happen only if user clicked "Open Project",
      // then clean workspace, and then clicked to open one of project, that was deleted
      const sendMock = (eventName, err) => {
        assert.equal(eventName, EVENTS.WORKSPACE_ERROR);
        assert.equal(err.errorCode, ERROR_CODES.CANT_OPEN_SELECTED_PROJECT);
      };
      WA.onSelectProject(
        sendMock,
        loadMock(PATH.EMPTY_WORKSPACE),
        { path: resolve(PATH.EMPTY_WORKSPACE, DEFAULT_PROJECT_NAME) }
      ).catch(() => done());
    });
  });

  describe('onCreateWorkspace', () => {
    const subscribeOnSelectProject = (done, path) => WA.WorkspaceEvents.once(
      EVENTS.SELECT_PROJECT,
      ({ projectMeta }) => {
        WA.onSelectProject(
          (eventName, project) => {
            assert.equal(eventName, EVENTS.REQUEST_SHOW_PROJECT);
            assert.equal(getProjectName(project), DEFAULT_PROJECT_NAME);
          },
          loadMock(path),
          projectMeta
        ).then(() => done());
      }
    );

    it('not existent workspace: spawn .xodworkspace, stdlib, save path, spawn default project and request to open it', (done) => {
      subscribeOnSelectProject(done, PATH.NOT_EXIST);

      WA.onCreateWorkspace(
        (eventName) => {
          assert.equal(eventName, EVENTS.UPDATE_WORKSPACE);
        },
        saveMock(PATH.NOT_EXIST),
        PATH.NOT_EXIST
      );
    });
    it('empty workspace: spawn default project and request to open it', (done) => {
      subscribeOnSelectProject(done, PATH.EMPTY_WORKSPACE);

      WA.onCreateWorkspace(
        (eventName) => {
          assert.equal(eventName, EVENTS.UPDATE_WORKSPACE);
        },
        saveMock(PATH.EMPTY_WORKSPACE),
        PATH.EMPTY_WORKSPACE
      );
    });
  });
});
