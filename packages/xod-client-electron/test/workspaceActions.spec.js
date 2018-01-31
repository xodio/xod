import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { resolve } from 'path';
import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { rmrf, spawnDefaultProject, getLocalProjects, resolvePath } from 'xod-fs';
import { getProjectName } from 'xod-project';

import * as WA from '../src/app/workspaceActions';
import * as ERROR_CODES from '../src/shared/errorCodes';
import * as EVENTS from '../src/shared/events';

chai.use(chaiAsPromised);

const fixture = path => resolve(__dirname, './fixtures', path);

const expectRejectedWithCode = (promise, errorCode) => expect(promise)
  .to.eventually.be.rejected
  .and.have.property('errorCode', errorCode);

describe('IDE', () => {
  const deleteTestFiles = () => Promise.all([
    rmrf(fixture('./notExistWorkspace')),
    rmrf(fixture('./emptyWorkspace/welcome-to-xod')),
    rmrf(fixture('./emptyWorkspace/lib')),
    rmrf(fixture('./xod')),
  ]);
  afterEach(deleteTestFiles);

  const loadMock = path => () => Promise.resolve(path);
  const saveMock = expectedPath => (actualPath) => {
    assert.equal(expectedPath, actualPath);
    return actualPath;
  };

  describe('could spawn whole workspace', () => {
    it('resolves a list of local projects',
      () => Promise.resolve(fixture('./notExistWorkspace'))
        .then(WA.spawnWorkspace)
        .then(spawnDefaultProject(WA.getDefaultProjectPath()))
        .then(getLocalProjects)
        .then((projects) => {
          assert.lengthOf(projects, 1);
        })
    );
  });

  describe('when launched', () => {
    describe('workspace does not exist(1st launch)', () => {
      // Change homedirectory to check spawning in homedir without questions
      const homeVar = (process.platform === 'win32') ? 'USERPROFILE' : 'HOME';
      const originalHomedir = process.env[homeVar];

      before(() => {
        process.env[homeVar] = fixture('');
      });
      after(() => {
        process.env[homeVar] = originalHomedir;
      });

      it('spawns workspace in homedir and opens welcome project', () => {
        const homedirWorkspace = resolvePath('~/xod');
        const eventsSequence = [];

        return WA.onIDELaunch(
          (eventName, data) => { eventsSequence.push({ eventName, data }); },
          (newPath) => {
            // because we are opening a built-in project
            assert.equal(newPath, null);
          },
          () => Maybe.Nothing(),
          loadMock(''),
          saveMock(homedirWorkspace)
        ).then(() => {
          assert.deepEqual(
            eventsSequence.map(R.prop('eventName')),
            [
              EVENTS.UPDATE_WORKSPACE,
              EVENTS.REQUEST_SHOW_PROJECT,
            ]
          );

          const openedProjectName = R.compose(
            getProjectName,
            R.path([1, 'data'])
          )(eventsSequence);
          assert.equal(openedProjectName, 'welcome-to-xod');
        });
      });
    });
    describe('workspace already exists(2nd+ launch)', () => {
      it('if no file to open is specified, `welcome-again` patch is opened', () => {
        const eventsSequence = [];

        return WA.onIDELaunch(
          (eventName, data) => { eventsSequence.push({ eventName, data }); },
          (newPath) => {
            // because we are opening a built-in project
            assert.equal(newPath, null);
          },
          () => Maybe.Nothing(),
          loadMock(fixture('./validWorkspace')),
          saveMock(fixture('./validWorkspace'))
        ).then(() => {
          assert.deepEqual(
            eventsSequence.map(R.prop('eventName')),
            [
              EVENTS.UPDATE_WORKSPACE,
              EVENTS.REQUEST_SHOW_PROJECT,
              EVENTS.PAN_TO_CENTER,
            ]
          );
        });
      });
    });
  });

  describe('when User requested to switch workspace', () => {
    it('if workspace is valid, stores path to workspace in settings', () => {
      const eventsSequence = [];

      return WA.onSwitchWorkspace(
        (eventName, data) => { eventsSequence.push({ eventName, data }); },
        saveMock(fixture('./validWorkspace')),
        fixture('./validWorkspace')
      ).then(() => {
        assert.deepEqual(
          eventsSequence,
          [
            {
              eventName: EVENTS.UPDATE_WORKSPACE,
              data: fixture('./validWorkspace'),
            },
          ]
        );
      });
    });
    it('if workspace does not exist, requests User to confirm creation of new workspace', () => {
      const sendMock = (eventName, { path, force }) => {
        assert.equal(eventName, EVENTS.REQUEST_CREATE_WORKSPACE);
        assert.equal(path, fixture('./notExistWorkspace'));
        assert.isFalse(force);
      };
      return WA.onSwitchWorkspace(sendMock, saveMock(fixture('./notExistWorkspace')), fixture('./notExistWorkspace'));
    });
    it('if choosed folder is not empty, requests User to confirm forced creation of new workspace in this directory', () => {
      const sendMock = (eventName, { path, force }) => {
        assert.equal(eventName, EVENTS.REQUEST_CREATE_WORKSPACE);
        assert.equal(path, fixture('.'));
        assert.isTrue(force);
      };
      return WA.onSwitchWorkspace(sendMock, saveMock(fixture('.')), fixture('.'));
    });
  });

  describe('when User confirms creating of new workspace', () => {
    it('if directory is empty or does not exist, spawns .xodworkspace, stdlib, default project, save path in settings, and requests to open default project', () =>
      WA.onCreateWorkspace(
        (eventName, updatedWorspacePath) => {
          assert.equal(eventName, EVENTS.UPDATE_WORKSPACE);
          assert.equal(updatedWorspacePath, fixture('./notExistWorkspace'));
        },
        saveMock(fixture('./notExistWorkspace')),
        fixture('./notExistWorkspace')
      )
    );
    it('if directory is workspace without projects, spawns only default project, save path in settings, and requests to open it', () =>
      WA.onCreateWorkspace(
        (eventName, updatedWorspacePath) => {
          assert.equal(eventName, EVENTS.UPDATE_WORKSPACE);
          assert.equal(updatedWorspacePath, fixture('./emptyWorkspace'));
        },
        saveMock(fixture('./emptyWorkspace')),
        fixture('./emptyWorkspace')
      )
    );
  });

  describe('when User selected project to open', () => {
    it('if workspace valid and has selected project: loads project and opens it in renderer', () => {
      const sendMock = (eventName, project) => {
        assert.equal(eventName, EVENTS.REQUEST_SHOW_PROJECT);
        assert.equal(getProjectName(project), 'welcome-to-xod');
      };
      return WA.onSelectProject(
        sendMock,
        loadMock(fixture('./validWorkspace')),
        { path: fixture('./validWorkspace/welcome-to-xod'), content: '' }
      );
    });
    it('if invalid workspace but valid projectMeta, shows error and requests to switch workspace', () => {
      // it could be happen only if user clicked "Open Project",
      // then clean workspace, and then clicked to open one of project, that was deleted
      const sendMock = (eventName, err) => {
        assert.equal(eventName, EVENTS.WORKSPACE_ERROR);
        assert.equal(err.errorCode, ERROR_CODES.CANT_OPEN_SELECTED_PROJECT);
      };

      return expectRejectedWithCode(
        WA.onSelectProject(
          (newProjectPath) => {
            assert.fail(
              newProjectPath,
              undefined,
              '`updateProjectPath` functions should not been called in this case'
            );
          }, // updateProjectPath function
          sendMock,
          loadMock(fixture('./emptyWorkspace')),
          { path: fixture('./emptyWorkspace/welcome-to-xod'), content: '' }
        ),
        ERROR_CODES.CANT_OPEN_SELECTED_PROJECT
      );
    });
  });

  describe('when User requests to create new project', () => {
    const deleteTestProject = () => rmrf(fixture('./emptyWorkspace/test'));
    afterEach(deleteTestProject);

    it('creates new project and resets project path to null', (done) => {
      WA.onCreateProject(
        (newProjectPath) => {
          assert.isNull(newProjectPath);
          done();
        }
      );
    });
  });
});
