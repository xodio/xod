import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as XP from 'xod-project';

import path from 'path';
import R from 'ramda';
import * as Loader from '../src/load';

import { fixture, expectRejectedWithCode } from './utils';
import * as ERROR_CODES from '../src/errorCodes';

chai.use(chaiAsPromised);

describe('Loader', () => {
  const workspace = path.resolve(__dirname, './fixtures/workspace');
  const brokenWorkspace = path.resolve(
    __dirname,
    './fixtures/broken-workspace'
  );
  const projectPath = 'awesome-project';

  it('getLocalProjects: return an array of local projects in workspace', () =>
    Loader.getLocalProjects(workspace).then(projects => {
      expect(projects).to.have.lengthOf(1);
      expect(projects).to.deep.equal([
        {
          path: path.resolve(workspace, projectPath),
          content: {
            authors: ['Amperka team'],
            description: '',
            license: '',
            name: 'awesome-project',
            version: '0.0.42',
          },
        },
      ]);
    }));

  it('getProjects: return an array of projects in workspace, including libs', () =>
    Loader.getProjects(workspace).then(projects => {
      expect(projects).to.have.lengthOf(5);
    }));
  it('getProjects: reject CANT_ENUMERATE_PROJECTS for non-existent workspace', () =>
    expectRejectedWithCode(
      Loader.getProjects(fixture('./notExistWorkspace')),
      ERROR_CODES.CANT_ENUMERATE_PROJECTS
    ));

  it('getLocalProjects: return an array of local projects in workspace', () =>
    Loader.getLocalProjects(workspace).then(projects => {
      expect(projects).to.have.lengthOf(1);
    }));
  it('getLocalProjects: reject CANT_ENUMERATE_PROJECTS for non-existent workspace', () =>
    expectRejectedWithCode(
      Loader.getLocalProjects(fixture('./notExistWorkspace')),
      ERROR_CODES.CANT_ENUMERATE_PROJECTS
    ));

  describe('loadProjectWithLibs', () => {
    it('should return project with libs', () =>
      Loader.loadProjectWithLibs(
        [workspace],
        path.resolve(workspace, projectPath)
      ).then(({ project, libs }) => {
        const quxPatch = R.find(
          R.pathEq(['content', 'path'], '@/qux'),
          project
        );
        assert.isDefined(quxPatch);
        assert.includeMembers(R.keys(libs), [
          'xod/core/led',
          'xod/core/and',
          'xod/core/pot',
          'xod/core/test',
          'xod/math/test',
          'user/utils/test',
        ]);
      }));

    it('should return rejected Promise when loading an ok project because of broken lib', () => {
      const okProject = path.resolve(brokenWorkspace, './ok-project');

      return expectRejectedWithCode(
        Loader.loadProjectWithLibs([brokenWorkspace], okProject),
        ERROR_CODES.INVALID_FILE_CONTENTS
      );
    });
  });

  describe('loadProject', () => {
    const assertPatchPaths = project =>
      assert.includeMembers(XP.listPatchPaths(project), [
        '@/main',
        '@/qux',
        '@/empty-local-patch',
        'xod/core/led',
        'xod/core/and',
        'xod/core/pot',
      ]);

    it('loads Project by provided path to project.xod file', () =>
      Loader.loadProject(
        [workspace],
        path.resolve(workspace, projectPath, 'project.xod')
      ).then(assertPatchPaths));
    it('loads Project by provided path to patch.xodp file', () =>
      Loader.loadProject(
        [workspace],
        path.resolve(workspace, projectPath, 'qux/patch.xodp')
      ).then(assertPatchPaths));
    it('loads Project by provided path to XOD project directory', () =>
      Loader.loadProject(
        [workspace],
        path.resolve(workspace, projectPath)
      ).then(assertPatchPaths));
    it('loads Project by provided path to directory inside XOD project', () =>
      Loader.loadProject(
        [workspace],
        path.resolve(workspace, projectPath, 'qux')
      ).then(assertPatchPaths));
    it('loads Project by provided path to some.xodball file', () =>
      Loader.loadProject(
        [workspace],
        path.resolve(workspace, '../some.xodball')
      ).then(assertPatchPaths));
  });
});
