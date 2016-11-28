import R from 'ramda';
import chai, { assert, expect } from 'chai';
import dirtyChai from 'dirty-chai';

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
  // description
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
  // license
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
  // authors
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
});
