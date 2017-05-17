import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { resolve } from 'path';
import fs from 'fs';
import { doesFileExist, doesDirectoryExist, rmrf } from 'xod-fs';
import { getProjectName } from 'xod-project';

import * as WA from '../src/app/workspaceActions';
import * as ERROR_CODES from '../src/shared/errorCodes';
import * as EVENTS from '../src/shared/events';

chai.use(chaiAsPromised);

const fixture = path => resolve(__dirname, './fixtures', path);

const expectRejectedWithCode = (promise, errorCode) => expect(promise)
  .to.eventually.be.rejected
  .and.have.property('errorCode', errorCode);

describe('Utils', () => {
  afterEach(() => rmrf(fixture('./notExistWorkspace')));

  describe('resolveWorkspacePath', () => {
    it('Promise.Resolved Path for valid value',
      () => assert.eventually.equal(
        WA.resolveWorkspacePath(fixture('./validWorkspace')),
        fixture('./validWorkspace')
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
        WA.isWorkspaceValid(fixture('./validWorkspace')),
        fixture('./validWorkspace')
      )
    );
    it('empty workspace: return Promise.Rejected Error WORKSPACE_DIR_NOT_EMPTY',
      () => expectRejectedWithCode(
        WA.isWorkspaceValid(fixture('./emptyWorkspace')),
        ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY
      )
    );
    it('not existent workspace: return Promise.Rejected Error WORKSPACE_DIR_NOT_EXIST_OR_EMPTY',
      () => expectRejectedWithCode(
        WA.isWorkspaceValid(fixture('./notExistWorkspace')),
        ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY
      )
    );
  });

  describe('validateWorkspace', () => {
    it('Promise.Resolved Path for valid workspace',
      () => assert.eventually.equal(
        WA.validateWorkspace(fixture('./validWorkspace')),
        fixture('./validWorkspace')
      )
    );
    it('Promise.Rejected Error WORKSPACE_DIR_NOT_EXIST_OR_EMPTY for not existent directory',
      () => expectRejectedWithCode(
        WA.validateWorkspace(fixture('./notExistWorkspace')),
        ERROR_CODES.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY
      )
    );
    it('Promise.Rejected Error WORKSPACE_DIR_NOT_EMPTY for not empty directory without workspace file',
      () => expectRejectedWithCode(
        WA.validateWorkspace(fixture('.')),
        ERROR_CODES.WORKSPACE_DIR_NOT_EMPTY
      )
    );
  });

  describe('spawnWorkspaceFile', () => {
    it('Promise.Resolved Path for successfull spawning',
      () => WA.spawnWorkspaceFile(fixture('./notExistWorkspace'))
        .then((path) => {
          assert.equal(path, fixture('./notExistWorkspace'));
          assert.ok(doesFileExist(fixture('./notExistWorkspace/.xodworkspace')));
        })
    );
  });

  describe('spawnStdLib', () => {
    it('Promise.Resolved Path for successfull spawnking',
      () => WA.spawnStdLib(fixture('./notExistWorkspace')).then(() => {
        assert.ok(doesDirectoryExist(fixture('./notExistWorkspace/lib')));
        fs.readdir(fixture('./notExistWorkspace/lib'), (err, files) => {
          assert.includeMembers(files, ['xod']);
        });
      })
    );
  });

  describe('spawnDefaultProject', () => {
    it('Promise.Resolved Path for successfull spawnking',
      () => WA.spawnDefaultProject(fixture('./notExistWorkspace')).then(() => {
        assert.ok(doesDirectoryExist(fixture('./notExistWorkspace/welcome-to-xod')));
        fs.readdir(fixture('./notExistWorkspace/welcome-to-xod'), (err, files) => {
          assert.includeMembers(files, ['project.xod', 'main']);
        });
      })
    );
  });

  describe('enumerateProjects', () => {
    it('Promise.Resolve ProjectMeta for valid workspace',
      () => assert.eventually.lengthOf(
        WA.enumerateProjects(fixture('./validWorkspace')),
        1
      )
    );
    it('Promise.Reject Error CANT_ENUMERATE_PROJECTS',
      () => expectRejectedWithCode(
        WA.enumerateProjects(fixture('./notExistWorkspace')),
        ERROR_CODES.CANT_ENUMERATE_PROJECTS
      )
    );
  });
});

describe('End-to-End', () => {
  const deleteTestFiles = () => Promise.all([
    rmrf(fixture('./notExistWorkspace')),
    rmrf(fixture('./emptyWorkspace/welcome-to-xod')),
    rmrf(fixture('./emptyWorkspace/lib')),
  ]);
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
      assert.equal(data[0].name, 'welcome-to-xod');
    }
  };

  describe('spawn workspace pipeline', () => {
    it('should spawn everything and enumerate all projects (not libs)',
      () => Promise.resolve(fixture('./notExistWorkspace'))
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
        loadMock(fixture('./validWorkspace')),
        saveMock(fixture('./validWorkspace'))
      )
    );
    it('not exist workspace: should spawn workspace in homedir, spawn default project and request to open it',
      () => WA.onIDELaunch(
        (eventName, { path, force }) => {
          assert.equal(eventName, EVENTS.REQUEST_CREATE_WORKSPACE);
          assert.equal(path, fixture('./notExistWorkspace'));
          assert.isFalse(force);
        },
        loadMock(fixture('./notExistWorkspace')),
        saveMock(fixture('./notExistWorkspace'))
      )
    );
  });

  describe('onSwitchWorkspace', () => {
    it('valid workspace: Promise.Resolved ProjectMeta[]',
      () => WA.onSwitchWorkspace(
        sendMockDefault,
        saveMock(fixture('./validWorkspace')),
        fixture('./validWorkspace')
      )
    );
    it('not existent workspace: requet User to confirm creation', () => {
      const sendMock = (eventName, { path, force }) => {
        assert.equal(eventName, EVENTS.REQUEST_CREATE_WORKSPACE);
        assert.equal(path, fixture('./notExistWorkspace'));
        assert.isFalse(force);
      };
      return WA.onSwitchWorkspace(sendMock, saveMock(fixture('./notExistWorkspace')), fixture('./notExistWorkspace'));
    });
    it('not empty folder: request User to confirm forced creation', () => {
      const sendMock = (eventName, { path, force }) => {
        assert.equal(eventName, EVENTS.REQUEST_CREATE_WORKSPACE);
        assert.equal(path, fixture('.'));
        assert.isTrue(force);
      };
      return WA.onSwitchWorkspace(sendMock, saveMock(fixture('.')), fixture('.'));
    });
  });

  describe('onOpenProject', () => {
    it('valid workspace: Promise.Resolved ProjectMeta[]',
      () => WA.onOpenProject(sendMockDefault, loadMock(fixture('./validWorkspace')))
    );
    it('invalid workspace: show error and request to change workspace', () => {
      const sendMock = (eventName, err) => {
        assert.equal(eventName, EVENTS.WORKSPACE_ERROR);
        assert.equal(err.errorCode, ERROR_CODES.CANT_ENUMERATE_PROJECTS);
      };
      return expectRejectedWithCode(
        WA.onOpenProject(sendMock, loadMock(fixture('./notExistWorkspace'))),
        ERROR_CODES.CANT_ENUMERATE_PROJECTS
      );
    });
    it('empty workspace: spawn default project and request to open it',
      () => WA.onOpenProject(sendMockDefault, loadMock(fixture('./emptyWorkspace')))
    );
  });

  describe('onCreateProject', () => {
    const deleteTestProject = () => rmrf(fixture('./emptyWorkspace/test'));
    afterEach(deleteTestProject);

    it('should create, save and request to open new project', () => {
      const sendMock = (eventName, projectMeta) => {
        assert.equal(eventName, EVENTS.REQUEST_SHOW_PROJECT);
        assert.equal(projectMeta.name, 'test');
      };
      WA.onCreateProject(sendMock, loadMock(fixture('./emptyWorkspace')), 'test');
    });
  });

  describe('onSelectProject', () => {
    it('valid workspace and projectMeta: load project and request opening it in renderer', () => {
      const sendMock = (eventName, project) => {
        assert.equal(eventName, EVENTS.REQUEST_SHOW_PROJECT);
        assert.equal(getProjectName(project), 'welcome-to-xod');
      };
      return WA.onSelectProject(
        sendMock,
        loadMock(fixture('./validWorkspace')),
        { path: fixture('./validWorkspace/welcome-to-xod') }
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
          loadMock(fixture('./emptyWorkspace')),
          { path: fixture('./emptyWorkspace/welcome-to-xod') }
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
            assert.equal(getProjectName(project), 'welcome-to-xod');
          },
          loadMock(path),
          projectMeta
        ).then(() => done());
      }
    );

    it('not existent workspace: spawn .xodworkspace, stdlib, save path, spawn default project and request to open it', (done) => {
      subscribeOnSelectProject(done, fixture('./notExistWorkspace'));

      WA.onCreateWorkspace(
        (eventName) => {
          assert.equal(eventName, EVENTS.UPDATE_WORKSPACE);
        },
        saveMock(fixture('./notExistWorkspace')),
        fixture('./notExistWorkspace')
      );
    });
    it('empty workspace: spawn default project and request to open it', (done) => {
      subscribeOnSelectProject(done, fixture('./emptyWorkspace'));

      WA.onCreateWorkspace(
        (eventName) => {
          assert.equal(eventName, EVENTS.UPDATE_WORKSPACE);
        },
        saveMock(fixture('./emptyWorkspace')),
        fixture('./emptyWorkspace')
      );
    });
  });
});
