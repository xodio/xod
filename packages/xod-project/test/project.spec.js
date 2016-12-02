import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import { expectEither } from './helpers';

import * as Patch from '../src/patch';
import * as Project from '../src/project';

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
    it('should return Either.Right for string', () => {
      expect(Project.setProjectDescription('test', {}).isRight).to.be.true();
    });
    it('should return Either.Left for non-string', () => {
      expect(Project.setProjectDescription(123, {}).isLeft).to.be.true();
      expect(Project.setProjectDescription(true, {}).isLeft).to.be.true();
      expect(Project.setProjectDescription({}, {}).isLeft).to.be.true();
      expect(Project.setProjectDescription([], {}).isLeft).to.be.true();
    });
  });
  describe('getProjectDescription', () => {
    it('should return empty string even if Project is empty object', () => {
      expect(Project.getProjectDescription({})).to.be.equal('');
    });
    it('should return string', () => {
      const fixture = {
        description: 'test',
      };
      expect(Project.getProjectDescription(fixture)).to.be.equal('test');
    });
  });

  describe('setProjectLicense', () => {
    it('should return Either.Right for string', () => {
      expect(Project.setProjectLicense('BSD', {}).isRight).to.be.true();
    });
    it('should return Either.Left for non-string', () => {
      expect(Project.setProjectLicense(123, {}).isLeft).to.be.true();
      expect(Project.setProjectLicense(true, {}).isLeft).to.be.true();
      expect(Project.setProjectLicense({}, {}).isLeft).to.be.true();
      expect(Project.setProjectLicense([], {}).isLeft).to.be.true();
    });
  });
  describe('getProjectLicense', () => {
    it('should return empty string even if Project is empty object', () => {
      expect(Project.getProjectLicense({})).to.be.equal('');
    });
    it('should return string', () => {
      const fixture = {
        license: 'MIT',
      };
      expect(Project.getProjectLicense(fixture)).to.be.equal('MIT');
    });
  });

  describe('setProjectAuthors', () => {
    it('should return Either.Right for empty array', () => {
      expect(Project.setProjectAuthors([], {}).isRight).to.be.true();
    });
    it('should return Either.Right for array with one string', () => {
      expect(Project.setProjectAuthors(['Vasya'], {}).isRight).to.be.true();
    });
    it('should return Either.Right for array of strings', () => {
      expect(Project.setProjectAuthors(['Vasya', 'Petya'], {}).isRight).to.be.true();
    });

    it('should return Either.Left for array of not strings', () => {
      expect(Project.setProjectAuthors([1, 2], {}).isLeft).to.be.true();
    });
    it('should return Either.Left for array of mixed types', () => {
      expect(Project.setProjectAuthors(['Vasya', 142, {}, 'Petya'], {}).isLeft).to.be.true();
    });
    it('should return Either.Left for not-array', () => {
      expect(Project.setProjectAuthors('Vasya', {}).isLeft).to.be.true();
      expect(Project.setProjectAuthors(12, {}).isLeft).to.be.true();
      expect(Project.setProjectAuthors(true, {}).isLeft).to.be.true();
      expect(Project.setProjectAuthors({}, {}).isLeft).to.be.true();
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
  describe('getPatchPath', () => {
    const path = '@/test';
    const patch = { path };
    const project = { patches: { [path]: patch } };

    it('should return Either.Left', () => {
      const result = Project.getPatchPath({}, project);
      expect(result.isLeft).to.be.true();
    });
    it('should return Either.Right with patch path', () => {
      const result = Project.getPatchPath(patch, project);
      expect(result.isRight).to.be.true();

      /* istanbul ignore next */
      expectEither(
        val => val === path,
        result
      );
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
    });
    it('should return Either.Left if another patch with same path already exist', () => {
      const project = { patches: { '@/test': {}, '@/patch': {} } };
      const newProject = Project.validatePatchRebase('@/test', '@/patch', project);

      expect(newProject.isLeft).to.be.true();
    });
    it('should return Either.Right with Project', () => {
      const patch = {};
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = { patches: { [oldPath]: patch } };

      const newProject = Project.validatePatchRebase(newPath, oldPath, project);
      /* istanbul ignore next */
      expectEither(
        proj => {
          expect(proj).to.be.equal(project);
        },
        newProject
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
      const newProject = Project.assocPatch('', {}, {});
      expect(newProject.isLeft).to.be.true();
    });
    it('should assoc patch into project.patches even if its undefined', () => {
      const path = '@/test';
      const patch = Patch.createPatch();
      const newProject = Project.assocPatch(path, patch, {});

      expect(newProject.isRight).to.be.true();
      /* istanbul ignore next */
      expectEither(
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
      expectEither(
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
    const testRightCase = (newPath, oldPath, origPatch, projectToTest) => {
      const newProject = Project.rebasePatch(newPath, oldPath, projectToTest);
      expect(newProject.isRight).to.be.true();

      /* istanbul ignore next */
      expectEither(
        proj => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(newPath)
            .that.equal(origPatch);
          expect(proj.patches).to.have.all.keys(newPath);
        },
        newProject
      );
    };

    it('should return Either.Left if something is not valid', () => {

    });
    it('should return Either.Right for correct values', () => {
      const patch = {};
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = { patches: { [oldPath]: patch } };

      testRightCase(newPath, oldPath, patch, project);
    });
    it('should update all reference on changed path', () => {
      const patch = {};
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = { patches: { [oldPath]: patch, '@/withNodes': { nodes: { type: oldPath } } } };
    });
  });

  // etc
});
