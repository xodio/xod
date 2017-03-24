import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as CONST from '../src/constants';
import * as Patch from '../src/patch';
import * as Project from '../src/project';
import { formatString } from '../src/utils';

import * as Helper from './helpers';

chai.use(dirtyChai);

const emptyProject = Helper.defaultizeProject({});

describe('Project', () => {
  describe('createProject', () => {
    it('should return object', () => {
      expect(Project.createProject()).to.be.an('object');
    });
    it('should have key: authors === []', () => {
      const proj = Project.createProject();
      expect(proj)
        .to.have.property('authors')
        .that.is.an('array')
        .that.have.lengthOf(0);
    });
    it('should have key: description === []', () => {
      const proj = Project.createProject();
      expect(proj)
        .to.have.property('description')
        .that.is.an('string')
        .that.is.empty();
    });
    it('should have key: license === []', () => {
      const proj = Project.createProject();
      expect(proj)
        .to.have.property('license')
        .that.is.an('string')
        .that.is.empty();
    });
    it('should have key: patches === {}', () => {
      const proj = Project.createProject();
      expect(proj)
        .to.have.property('patches')
        .that.is.an('object')
        .that.is.empty();
    });
  });

  describe('setProjectAuthors', () => {
    it('should return Project with authors equal to empty array', () => {
      expect(Project.setProjectAuthors([], emptyProject))
        .to.be.an('object')
        .that.have.property('authors')
        .to.be.instanceof(Array)
        .to.be.empty();
    });
    it('should return Project with assigned array into authors', () => {
      const authors = ['Vasya', 'Petya'];
      expect(Project.setProjectAuthors(authors, emptyProject))
        .to.be.an('object')
        .that.have.property('authors')
        .that.deep.equal(authors);
    });
  });
  describe('getProjectAuthors', () => {
    it('should return empty array even if Project is empty object', () => {
      expect(Project.getProjectAuthors(emptyProject)).to.be.empty();
    });
    it('should return array of authors', () => {
      const project = Helper.defaultizeProject({
        authors: ['Vasya', 'Petya'],
      });
      expect(Project.getProjectAuthors(project)).to.have.members(['Vasya', 'Petya']);
    });
  });

  // entity getters / search functions
  describe('getPatchByPath', () => {
    it('should return Nothing<Null> if project is empty object', () => {
      const maybe = Project.getPatchByPath('test', emptyProject);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Nothing<Null> if there is no patch with such path', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/one': {},
        },
      });
      const maybe = Project.getPatchByPath('@/two', project);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Just<{}> if project have a patch', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/one': {},
        },
      });
      const maybe = Project.getPatchByPath('@/one', project);
      expect(maybe.isJust).to.be.true();
    });
  });
  describe('getPatchByPathUnsafe', () => {
    it('should throw error if project is empty object', () => {
      const fn = () => Project.getPatchByPathUnsafe('test', emptyProject);
      expect(fn).to.throw(Error, formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, { patchPath: 'test' }));
    });
    it('should throw error if there is no patch with such path', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/one': {},
        },
      });
      const fn = () => Project.getPatchByPathUnsafe('@/two', project);
      expect(fn).to.throw(Error, formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, { patchPath: '@/two' }));
    });
    it('should return Patch if project have a patch', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/one': {},
        },
      });
      const patch = Project.getPatchByPathUnsafe('@/one', project);
      expect(patch).to.be.deep.equal(project.patches['@/one']);
    });
  });
  describe('lsPatches', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/folder/patch': {},
        '@/folder/patch2': {},
        '@/folder/subfolder/patch3': {},
        '@/folder2/patch4': {},
        '@/patch5': {},
      },
    });

    it('should return an object with patches', () => {
      expect(Project.lsPatches('@/', project))
        .to.be.an('object');
      expect(Project.lsPatches('@', project))
        .to.be.an('object');
    });
    it('should return only patches in the specified path', () => {
      expect(Project.lsPatches('@/folder', project))
        .to.be.an('object')
        .that.have.all.keys([
          '@/folder/patch',
          '@/folder/patch2',
        ]);
    });
  });
  describe('lsDirs', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/folder/patch': {},
        '@/folder/subfolder/patch3': {},
        '@/folder2/patch4': {},
        '@/patch5': {},
      },
    });

    it('should return a list of strings', () => {
      expect(Project.lsDirs('@/', project))
        .to.be.instanceof(Array);
      expect(Project.lsDirs('@', project))
      .to.be.instanceof(Array);
    });
    it('should return only dirs in the specified path', () => {
      expect(Project.lsDirs('@/folder', project))
        .to.be.instanceof(Array)
        .that.have.members([
          'subfolder',
        ]);
    });
    it('should return only unique dirs', () => {
      expect(Project.lsDirs('@', project))
        .to.be.instanceof(Array)
        .that.have.members([
          'folder',
          'folder2',
        ]);
    });
  });
  describe('getNodePin', () => {
    const pin = Helper.defaultizePin({ type: CONST.PIN_TYPE.NUMBER });
    const project = Helper.defaultizeProject({
      patches: {
        'xod/core/test': {
          pins: {
            a: pin,
          },
        },
      },
    });

    it('should return Nothing for unexisting patch', () => {
      const maybe = Project.getNodePin('test', Helper.defaultizeNode({ type: 'unexisting/patch' }), emptyProject);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Nothing for unexisting pin', () => {
      const maybe = Project.getNodePin('b', Helper.defaultizeNode({ type: 'xod/core/test' }), project);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Just<Pin> for existing pin', () => {
      const maybe = Project.getNodePin('a', Helper.defaultizeNode({ type: 'xod/core/test' }), project);
      expect(maybe.isJust).to.be.true();
      expect(R.unnest(maybe)).to.be.deep.equal(pin);
    });
  });

  // validations
  describe('validatePatchRebase', () => {
    it('should return Either.Left if newPath contains invalid characters', () => {
      const patch = {};
      const project = Helper.defaultizeProject({ patches: { '@/test': patch } });
      const newProject = Project.validatePatchRebase('in√ålid path', '@/test', project);

      expect(newProject.isLeft).to.be.true();
    });
    it('should return Either.Left if patch is not in the project', () => {
      const newProject = Project.validatePatchRebase('@/test', '@/patch', emptyProject);

      expect(newProject.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, newProject, formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, { patchPath: '@/patch' }));
    });
    it('should return Either.Left if another patch with same path already exist', () => {
      const project = Helper.defaultizeProject({
        patches: { '@/test': {}, '@/patch': {} },
      });
      const newProject = Project.validatePatchRebase('@/test', '@/patch', project);

      expect(newProject.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, newProject, CONST.ERROR.PATCH_PATH_OCCUPIED);
    });
    it('should return Either.Right with Project', () => {
      const patch = {};
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = Helper.defaultizeProject({ patches: { [oldPath]: patch } });

      const newProject = Project.validatePatchRebase(newPath, oldPath, project);
      Helper.expectEither(
        (proj) => {
          expect(proj).to.be.equal(project);
        },
        newProject
      );
    });
  });
  describe('validatePatchContents', () => {
    const smallProject = Helper.defaultizeProject({
      patches: {
        '@/test': {},
      },
    });
    const fullProject = Helper.defaultizeProject({
      patches: {
        '@/test': {
          pins: {
            in: { key: 'in' },
            out: { key: 'out' },
          },
        },
      },
    });
    const patchWithNodeOnly = Helper.defaultizePatch({
      nodes: {
        a: { id: 'a', type: '@/test' },
      },
    });
    const fullPatch = Helper.defaultizePatch({
      nodes: {
        a: { id: 'a', type: '@/test' },
        b: { id: 'b', type: '@/test' },
      },
      links: {
        l: {
          id: 'l',
          input: { nodeId: 'a', pinKey: 'in' },
          output: { nodeId: 'b', pinKey: 'out' },
        },
      },
    });

    it('should be Either.Left for non-existent type', () => {
      const result = Project.validatePatchContents(patchWithNodeOnly, emptyProject);
      expect(result.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, result, CONST.ERROR.TYPE_NOT_FOUND);
    });
    it('should be Either.Left for non-existent pins', () => {
      const result = Project.validatePatchContents(fullPatch, smallProject);
      expect(result.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, result, CONST.ERROR.PINS_NOT_FOUND);
    });
    it('should be Either.Right for empty patch', () => {
      const newPatch = Helper.defaultizePatch({ path: '@/test2' });
      const result = Project.validatePatchContents(newPatch, smallProject);
      expect(result.isRight).to.be.true();
      Helper.expectEither(
        validPatch => expect(validPatch).to.be.equal(newPatch),
        result
      );
    });
    it('should be Either.Right for patch with valid node without links', () => {
      const result = Project.validatePatchContents(patchWithNodeOnly, smallProject);
      expect(result.isRight).to.be.true();
      Helper.expectEither(
        validPatch => expect(validPatch).to.be.equal(patchWithNodeOnly),
        result
      );
    });
    it('should be Either.Right for valid new patch', () => {
      const result = Project.validatePatchContents(fullPatch, fullProject);
      expect(result.isRight).to.be.true();
      Helper.expectEither(
        validPatch => expect(validPatch).to.be.equal(fullPatch),
        result
      );
    });
  });

  // entity setters
  describe('assocPatch', () => {
    it('should return Either.Left if path is not valid', () => {
      const newProject = Project.assocPatch('', Patch.createPatch(), emptyProject);
      expect(newProject.isLeft).to.be.true();
    });
    it('should return Either.Right with associated patch', () => {
      const path = '@/test';
      const patch = Patch.createPatch();
      const newProject = Project.assocPatch(path, patch, emptyProject);
      expect(newProject.isRight).to.be.true();
      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(path)
            .that.deep.equals(R.assoc('path', path, patch));
        },
        newProject
      );
    });
    it('should not remove other patches from project', () => {
      const oldPath = '@/old';
      const oldPatch = Patch.createPatch();
      const newPath = '@/new';
      const newPatch = Patch.createPatch();
      const project = Helper.defaultizeProject({
        patches: {
          [oldPath]: oldPatch,
        },
      });
      const newProject = Project.assocPatch(newPath, newPatch, project);

      expect(newProject.isRight).to.be.true();
      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.contains.all.keys([newPath, oldPath]);
          expect(proj.patches[oldPatch.path]).to.be.equal(oldPatch);
          expect(proj.patches[newPatch.path]).to.be.equal(newPatch);
        }
      );
    });
  });
  describe('dissocPatch', () => {
    it('should dissocPatch by path string', () => {
      const path = '@/test';
      const patch = {};
      const project = Helper.defaultizeProject({ patches: { [path]: patch } });
      const newProject = Project.dissocPatch(path, project);
      expect(newProject)
        .to.have.property('patches')
        .that.empty();
    });
    it('should not affect on other patches', () => {
      const patch = { path: '@/test' };
      const anotherPatch = { path: '@/leave/me/alone' };
      const project = Helper.defaultizeProject({
        patches: {
          [patch.path]: patch,
          [anotherPatch.path]: anotherPatch,
        },
      });
      const newProject = Project.dissocPatch(patch.path, project);
      expect(newProject)
        .to.have.property('patches')
        .that.contain.all.keys([anotherPatch.path]);
    });
    it('should return project even if it has no patches', () => {
      const newProject = Project.dissocPatch('@/test', emptyProject);
      expect(newProject).to.be.deep.equal(emptyProject);
    });
  });
  describe('rebasePatch', () => {
    it('should return Either.Left if something is not valid', () => {
      expect(Project.rebasePatch('@/new', '@/old', emptyProject).isLeft)
        .to.be.true();
    });
    it('should return Either.Right for correct values', () => {
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = Helper.defaultizeProject({ patches: { [oldPath]: {} } });

      const newProject = Project.rebasePatch(newPath, oldPath, project);
      expect(newProject.isRight).to.be.true();

      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(newPath);
          expect(proj.patches).to.have.all.keys(newPath);
        },
        newProject
      );
    });
    it('should update path property of a moved patch', () => {
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = Helper.defaultizeProject({
        patches: {
          [oldPath]: { path: oldPath },
        },
      });

      const newProject = Project.rebasePatch(newPath, oldPath, project);

      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(newPath)
            .that.have.property('path')
            .that.equals(newPath);
        },
        newProject
      );
    });
    it('should update all reference on changed path', () => {
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const withNodesPath = '@/withNodes';
      const project = Helper.defaultizeProject({
        patches: {
          [oldPath]: {},
          [withNodesPath]: {
            nodes: { 1: { type: oldPath } },
          },
        },
      });

      const newProject = Project.rebasePatch(newPath, oldPath, project);
      expect(newProject.isRight).to.be.true();

      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(withNodesPath)
            .that.have.property('nodes')
            .that.have.property('1')
            .that.have.property('type')
            .that.equal(newPath);

          expect(proj.patches).to.have.all.keys([newPath, withNodesPath]);
        },
        newProject
      );
    });
  });

  // lists
  describe('lists', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/test': { path: '@/test' },
        'external/patch': { path: 'external/patch' },
      },
    });

    describe('listPatches', () => {
      it('should return empty array for empty project', () => {
        expect(Project.listPatches(emptyProject))
          .to.be.instanceof(Array)
          .and.to.be.empty();
      });
      it('should return array with two patches', () => {
        expect(Project.listPatches(project))
          .to.be.instanceof(Array)
          .and.have.lengthOf(2);
      });
    });
    describe('listPatchPaths', () => {
      it('should return empty array for empty project', () => {
        expect(Project.listPatchPaths(emptyProject))
          .to.be.instanceof(Array)
          .and.to.be.empty();
      });
      it('should return array with two keys', () => {
        expect(Project.listPatchPaths(project))
          .to.be.deep.equal(['@/test', 'external/patch']);
      });
    });
    describe('listLocalPatches', () => {
      it('should return empty array for empty project', () => {
        expect(Project.listLocalPatches(emptyProject))
          .to.be.instanceof(Array)
          .and.to.be.empty();
      });
      it('should return array with one pin', () => {
        expect(Project.listLocalPatches(project))
          .to.be.instanceof(Array)
          .and.have.all.members([project.patches['@/test']]);
      });
    });
    describe('listLibraryPatches', () => {
      it('should return empty array for empty project', () => {
        expect(Project.listLibraryPatches(emptyProject))
          .to.be.instanceof(Array)
          .and.to.be.empty();
      });
      it('should return array with one pin', () => {
        expect(Project.listLibraryPatches(project))
          .to.be.instanceof(Array)
          .and.have.all.members([project.patches['external/patch']]);
      });
    });
  });

  // etc
});
