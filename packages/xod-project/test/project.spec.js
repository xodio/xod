import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as CONST from '../src/constants';
import * as Patch from '../src/patch';
import * as Project from '../src/project';

import * as Helper from './helpers';

chai.use(dirtyChai);

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

  // properties
  describe('setProjectDescription', () => {
    Helper.expectOptionalStringSetter(expect, Project.setProjectDescription, 'description');
  });
  describe('getProjectDescription', () => {
    Helper.expectOptionalStringGetter(expect, Project.getProjectDescription, 'description');
  });

  describe('setProjectLicense', () => {
    Helper.expectOptionalStringSetter(expect, Project.setProjectLicense, 'license');
  });
  describe('getProjectLicense', () => {
    Helper.expectOptionalStringGetter(expect, Project.getProjectLicense, 'license');
  });

  describe('setProjectAuthors', () => {
    it('should return Project with authors equal to empty array', () => {
      expect(Project.setProjectAuthors([], {}))
        .to.be.an('object')
        .that.have.property('authors')
        .to.be.instanceof(Array)
        .to.be.empty();
    });
    it('should return Project with assigned array into authors', () => {
      const authors = ['Vasya', 'Petya'];
      expect(Project.setProjectAuthors(authors, {}))
        .to.be.an('object')
        .that.have.property('authors')
        .that.deep.equal(authors);
    });
    it('should return Project with single string in authors array', () => {
      expect(Project.setProjectAuthors('Petya', {}))
        .to.be.an('object')
        .that.have.property('authors')
        .that.have.property(0)
        .that.equal('Petya');
    });
    it('should return Project with single string (number converted into string) in authors array', () => {
      expect(Project.setProjectAuthors(6, {}))
        .to.be.an('object')
        .that.have.property('authors')
        .that.have.property(0)
        .that.equal('6');
    });
  });
  describe('getProjectAuthors', () => {
    it('should return empty array even if Project is empty object', () => {
      expect(Project.getProjectAuthors({})).to.be.empty();
    });
    it('should return array of authors', () => {
      const fixture = {
        authors: ['Vasya', 'Petya'],
      };
      expect(Project.getProjectAuthors(fixture)).to.have.members(['Vasya', 'Petya']);
    });
  });

  // entity getters / search functions
  describe('getPatchByPath', () => {
    it('should return Nothing<Null> if project is empty object', () => {
      const maybe = Project.getPatchByPath('test', {});
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Nothing<Null> if there is no patch with such path', () => {
      const project = {
        patches: {
          '@/one': {},
        },
      };
      const maybe = Project.getPatchByPath('@/two', project);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Just<{}> if project have a patch', () => {
      const patch = {};
      const project = {
        patches: {
          '@/one': patch,
        },
      };
      const maybe = Project.getPatchByPath('@/one', project);
      expect(maybe.isJust).to.be.true();
      expect(maybe.getOrElse(null)).to.be.equal(patch);
    });
  });
  describe('lsPatches', () => {
    const project = {
      patches: {
        '@/folder/patch': {},
        '@/folder/patch2': {},
        '@/folder/subfolder/patch3': {},
        '@/folder2/patch4': {},
        '@/patch5': {},
      },
    };

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
    const project = {
      patches: {
        '@/folder/patch': {},
        '@/folder/subfolder/patch3': {},
        '@/folder2/patch4': {},
        '@/patch5': {},
      },
    };

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

  // validations
  describe('validatePatchRebase', () => {
    it('should return Either.Left if newPath contains invalid characters', () => {
      const patch = {};
      const project = { patches: { '@/test': patch } };
      const newProject = Project.validatePatchRebase('in√ålid path', patch, project);

      expect(newProject.isLeft).to.be.true();
    });
    it('should return Either.Left if patch is not in the project', () => {
      const project = {};
      const newProject = Project.validatePatchRebase('@/test', '@/patch', project);

      expect(newProject.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, newProject, CONST.ERROR.PATCH_NOT_FOUND_BY_PATH);
    });
    it('should return Either.Left if another patch with same path already exist', () => {
      const project = { patches: { '@/test': {}, '@/patch': {} } };
      const newProject = Project.validatePatchRebase('@/test', '@/patch', project);

      expect(newProject.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, newProject, CONST.ERROR.PATCH_PATH_OCCUPIED);
    });
    it('should return Either.Right with Project', () => {
      const patch = {};
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = { patches: { [oldPath]: patch } };

      const newProject = Project.validatePatchRebase(newPath, oldPath, project);
      /* istanbul ignore next */
      Helper.expectEither(
        (proj) => {
          expect(proj).to.be.equal(project);
        },
        newProject
      );
    });
  });
  describe('validatePatchContents', () => {
    const smallProject = {
      patches: {
        '@/test': {},
      },
    };
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
      const result = Project.validatePatchContents(patchWithNodeOnly, {});
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
      const newProject = Project.assocPatch('', Patch.createPatch(), {});
      expect(newProject.isLeft).to.be.true();
    });
    it('should return Either.Left if patch is not valid', () => {
      const newProject = Project.assocPatch('@/test', {}, {});
      expect(newProject.isLeft).to.be.true();
    });
    it('should return Either.Right with associated patch', () => {
      const path = '@/test';
      const patch = Patch.createPatch();
      const newProject = Project.assocPatch(path, patch, {});
      expect(newProject.isRight).to.be.true();
      /* istanbul ignore next */
      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(path)
            .that.equals(patch);
        },
        newProject
      );
    });
    it('should not remove other patches from project', () => {
      const oldPath = '@/old';
      const oldPatch = Patch.createPatch();
      const newPath = '@/new';
      const newPatch = Patch.createPatch();
      const project = {
        patches: {
          [oldPath]: oldPatch,
        },
      };
      const newProject = Project.assocPatch(newPath, newPatch, project);

      expect(newProject.isRight).to.be.true();
      /* istanbul ignore next */
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
      const project = { patches: { [path]: patch } };
      const newProject = Project.dissocPatch(path, project);
      expect(newProject)
        .to.have.property('patches')
        .that.empty();
    });
    it('should not affect on other patches', () => {
      const patch = { path: '@/test' };
      const anotherPatch = { path: '@/leave/me/alone' };
      const project = { patches: { [patch.path]: patch, [anotherPatch.path]: anotherPatch } };
      const newProject = Project.dissocPatch(patch.path, project);
      expect(newProject)
        .to.have.property('patches')
        .that.contain.all.keys([anotherPatch.path]);
    });
    it('should return project even if it has no patches', () => {
      const project = {};
      const newProject = Project.dissocPatch('@/test', project);
      expect(newProject).to.be.equal(project);
    });
  });
  describe('rebasePatch', () => {
    it('should return Either.Left if something is not valid', () => {
      expect(Project.rebasePatch('@/new', '@/old', {}).isLeft)
        .to.be.true();
    });
    it('should return Either.Right for correct values', () => {
      const patch = {};
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = { patches: { [oldPath]: patch } };

      const newProject = Project.rebasePatch(newPath, oldPath, project);
      expect(newProject.isRight).to.be.true();

      /* istanbul ignore next */
      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(newPath)
            .that.equal(patch);
          expect(proj.patches).to.have.all.keys(newPath);
        },
        newProject
      );
    });
    it('should update all reference on changed path', () => {
      const patch = {};
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const withNodesPath = '@/withNodes';
      const project = { patches: { [oldPath]: patch, '@/withNodes': { nodes: { 1: { type: oldPath } } } } };

      const newProject = Project.rebasePatch(newPath, oldPath, project);
      expect(newProject.isRight).to.be.true();

      /* istanbul ignore next */
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

  describe('lists', () => {
    const project = {
      patches: {
        '@/test': { path: '@/test' },
        'external/patch': { path: 'external/patch' },
      },
    };

    describe('listPatches', () => {
      it('should return empty array for empty project', () => {
        expect(Project.listPatches({}))
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
        expect(Project.listPatchPaths({}))
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
        expect(Project.listLocalPatches({}))
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
        expect(Project.listLibraryPatches({}))
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
