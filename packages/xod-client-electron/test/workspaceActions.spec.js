import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { resolve } from 'path';
import fs from 'fs';
import { doesFileExist, doesDirectoryExist, rmrf } from 'xod-fs';
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

const expectRejectedWithCode = (promise, errorCode) => expect(promise)
  .to.eventually.be.rejected
  .and.have.property('errorCode', errorCode);

describe('Utils', () => {
  const deleteFolder = () => rmrf(PATH.NOT_EXIST);
  beforeEach(deleteFolder);
  afterEach(deleteFolder);

  describe('resolveWorkspacePath', () => {
    it('Promise.Resolved Path for valid value',
      () => assert.eventually.equal(
        WA.resolveWorkspacePath(PATH.VALID_WORKSPACE),
        PATH.VALID_WORKSPACE
      )
    );
    it('Promise.Rejected ERROR_CODE for null value',
      () => expectRejectedWithCode(
        WA.resolveWorkspacePath(null),
        ERROR_CODES.INVALID_WORKSPACE_PATH
      )
    );
    it('Promise.Rejected INVALID_WORKSPACE_PATH for empty string',
      () => expectRejectedWithCode(
        WA.resolveWorkspacePath(''),
        ERROR_CODES.INVALID_WORKSPACE_PATH
      )
    );
  });

  describe('isWorkspaceValid', () => {
    it('valid workspace: return Promise.Resolved Path',
      () => assert.eventually.equal(
        WA.isWorkspaceValid(PATH.VALID_WORKSPACE),
        PATH.VALID_WORKSPACE
      )
    );
    it('empty workspace: return Promise.Rejected Error WORKSPACE_DIR_NOT_EMPTY',
      () => expectRejectedWithCode(
        WA.isWorkspaceValid(PATH.EMPTY_WORKSPACE),
        ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY
      )
    );
    it('not existent workspace: return Promise.Rejected Error WORKSPACE_DIR_NOT_EXIST_OR_EMPTY',
      () => expectRejectedWithCode(
        WA.isWorkspaceValid(PATH.NOT_EXIST),
        ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY
      )
    );
  });

  describe('validateWorkspace', () => {
    it('Promise.Resolved Path for valid workspace',
      () => assert.eventually.equal(
        WA.validateWorkspace(PATH.VALID_WORKSPACE),
        PATH.VALID_WORKSPACE
      )
    );
    it('Promise.Rejected Error WORKSPACE_DIR_NOT_EXIST_OR_EMPTY for not existent directory',
      () => expectRejectedWithCode(
        WA.validateWorkspace(PATH.NOT_EXIST),
        ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY
      )
    );
    it('Promise.Rejected Error WORKSPACE_DIR_NOT_EMPTY for not empty directory without workspace file',
      () => expectRejectedWithCode(
        WA.validateWorkspace(PATH.FIXTURES),
        ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY
      )
    );
  });

  describe('spawnWorkspaceFile', () => {
    const testFile = resolve(PATH.NOT_EXIST, WORKSPACE_FILENAME);
    it('Promise.Resolved Path for successfull spawning',
      () => WA.spawnWorkspaceFile(PATH.NOT_EXIST).then((path) => {
        const filePath = resolve(path, WORKSPACE_FILENAME);
        assert.equal(testFile, filePath);
        assert.equal(doesFileExist(filePath), true);
      })
    );
  });

  describe('spawnStdLib', () => {
    const destFolder = resolve(PATH.NOT_EXIST, LIBS_FOLDERNAME);
    it('Promise.Resolved Path for successfull spawnking',
      () => WA.spawnStdLib(PATH.NOT_EXIST).then(() => {
        assert.equal(doesDirectoryExist(destFolder), true);
        fs.readdir(destFolder, (err, files) => {
          assert.isAbove(files.length, 0);
          assert.includeMembers(files, ['xod']);
        });
      })
    );
  });

  describe('spawnDefaultProject', () => {
    const destFolder = resolve(PATH.NOT_EXIST, DEFAULT_PROJECT_NAME);
    it('Promise.Resolved Path for successfull spawnking',
      () => WA.spawnDefaultProject(PATH.NOT_EXIST).then(() => {
        assert.equal(doesDirectoryExist(destFolder), true);
        fs.readdir(destFolder, (err, files) => {
          assert.isAbove(files.length, 0);
          assert.includeMembers(files, ['project.xod', 'main']);
        });
      })
    );
  });

  describe('enumerateProjects', () => {
    it('Promise.Resolve ProjectMeta for valid workspace',
      () => assert.eventually.lengthOf(
        WA.enumerateProjects(PATH.VALID_WORKSPACE),
        1
      )
    );
    it('Promise.Reject Error CANT_ENUMERATE_PROJECTS',
      () => expectRejectedWithCode(
        WA.enumerateProjects(PATH.NOT_EXIST),
        ERROR_CODES.CANT_ENUMERATE_PROJECTS
      )
    );
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
      assert.equal(data[0].name, DEFAULT_PROJECT_NAME);
    }
  };

  describe('spawn workspace pipeline', () => {
    it('should spawn everything and enumerate all projects (not libs)',
      () => Promise.resolve(PATH.NOT_EXIST)
        .then(WA.spawnWorkspaceFile)
        .then(WA.spawnStdLib)
        .then(WA.spawnDefaultProject)
        .then(WA.enumerateProjects)
        .then((projects) => {
          assert.lengthOf(projects, 1);
        })
    );
  });

  describe('onIDELaunch', () => {
    it('valid workspace with local project: should request User to select project',
      () => WA.onIDELaunch(
        sendMockDefault,
        loadMock(PATH.VALID_WORKSPACE),
        saveMock(PATH.VALID_WORKSPACE)
      )
    );
    it('not exist workspace: should spawn workspace in homedir, spawn default project and request to open it',
      () => WA.onIDELaunch(
        (eventName, { path, force }) => {
          assert.equal(eventName, EVENTS.REQUEST_CREATE_WORKSPACE);
          assert.equal(path, PATH.NOT_EXIST);
          assert.isFalse(force);
        },
        loadMock(PATH.NOT_EXIST),
        saveMock(PATH.NOT_EXIST)
      )
    );
  });

  describe('onSwitchWorkspace', () => {
    it('valid workspace: Promise.Resolved ProjectMeta[]',
      () => WA.onSwitchWorkspace(
        sendMockDefault,
        saveMock(PATH.VALID_WORKSPACE),
        PATH.VALID_WORKSPACE
      )
    );
    it('not existent workspace: requet User to confirm creation', () => {
      const sendMock = (eventName, { path, force }) => {
        assert.equal(eventName, EVENTS.REQUEST_CREATE_WORKSPACE);
        assert.equal(path, PATH.NOT_EXIST);
        assert.isFalse(force);
      };
      return WA.onSwitchWorkspace(sendMock, saveMock(PATH.NOT_EXIST), PATH.NOT_EXIST);
    });
    it('not empty folder: request User to confirm forced creation', () => {
      const sendMock = (eventName, { path, force }) => {
        assert.equal(eventName, EVENTS.REQUEST_CREATE_WORKSPACE);
        assert.equal(path, PATH.FIXTURES);
        assert.isTrue(force);
      };
      return WA.onSwitchWorkspace(sendMock, saveMock(PATH.FIXTURES), PATH.FIXTURES);
    });
  });

  describe('onOpenProject', () => {
    it('valid workspace: Promise.Resolved ProjectMeta[]',
      () => WA.onOpenProject(sendMockDefault, loadMock(PATH.VALID_WORKSPACE))
    );
    it('invalid workspace: show error and request to change workspace', () => {
      const sendMock = (eventName, err) => {
        assert.equal(eventName, EVENTS.WORKSPACE_ERROR);
        assert.equal(err.errorCode, ERROR_CODES.CANT_ENUMERATE_PROJECTS);
      };
      return expectRejectedWithCode(
        WA.onOpenProject(sendMock, loadMock(PATH.NOT_EXIST)),
        ERROR_CODES.CANT_ENUMERATE_PROJECTS
      );
    });
    it('empty workspace: spawn default project and request to open it',
      () => WA.onOpenProject(sendMockDefault, loadMock(PATH.EMPTY_WORKSPACE))
    );
  });

  describe('onCreateProject', () => {
    const deleteTestProject = () => rmrf(resolve(PATH.EMPTY_WORKSPACE, 'test'));
    beforeEach(deleteTestProject);
    afterEach(deleteTestProject);

    it('should create, save and request to open new project', () => {
      const sendMock = (eventName, projectMeta) => {
        assert.equal(eventName, EVENTS.REQUEST_SHOW_PROJECT);
        assert.equal(projectMeta.meta.name, 'test');
      };
      return WA.onCreateProject(sendMock, loadMock(PATH.EMPTY_WORKSPACE), 'test');
    });
  });

  describe('onSelectProject', () => {
    it('valid workspace and projectMeta: load project and request opening it in renderer', () => {
      const sendMock = (eventName, project) => {
        assert.equal(eventName, EVENTS.REQUEST_SHOW_PROJECT);
        assert.equal(getProjectName(project), DEFAULT_PROJECT_NAME);
      };
      return WA.onSelectProject(
        sendMock,
        loadMock(PATH.VALID_WORKSPACE),
        { path: resolve(PATH.VALID_WORKSPACE, DEFAULT_PROJECT_NAME) }
      );
    });
    it('invalid workspace but valid projectMeta: show error and ask to change workspace', () => {
      // it could be happen only if user clicked "Open Project",
      // then clean workspace, and then clicked to open one of project, that was deleted
      const sendMock = (eventName, err) => {
        assert.equal(eventName, EVENTS.WORKSPACE_ERROR);
        assert.equal(err.errorCode, ERROR_CODES.CANT_OPEN_SELECTED_PROJECT);
      };

      return expectRejectedWithCode(
        WA.onSelectProject(
          sendMock,
          loadMock(PATH.EMPTY_WORKSPACE),
          { path: resolve(PATH.EMPTY_WORKSPACE, DEFAULT_PROJECT_NAME) }
        ),
        ERROR_CODES.CANT_OPEN_SELECTED_PROJECT
      );
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
