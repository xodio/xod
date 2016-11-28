import R from 'ramda';
import chai, { assert, expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Project from '../src/project';

chai.use(dirtyChai);

describe('Project', () => {
  // project description
  describe('setProjectDescription', () => {
    it('should return Either.Right for string', () => {
      expect(Project.setProjectDescription('test', {}).isRight).to.be.true();
    });
    it('should return Either.Left for non-string', () => {
      expect(Project.setProjectDescription(123, {}).isLeft).to.be.true();
    });
  });
  describe('getProjectDescription', () => {
    it('should return empty string even if Project is empty object', () => {
      expect(Project.getProjectDescription({})).to.be.equal('');
    });
    it('should return description string', () => {
      const fixture = {
        description: 'test',
      };
      expect(Project.getProjectDescription(fixture)).to.be.equal('test');
    });
  });
  // project authors
  describe('setProjectAuthors', () => {
    it('should return Either.Right for []', () => {
      expect(Project.setProjectAuthors([], {}).isRight).to.be.true();
    });
  });
    assert(
      Project.setProjectAuthors(['Vasya'], {}).isRight,
      'Right because list of string was passed'
    );
    assert(
      Project.setProjectAuthors(['Vasya', 'Petya'], {}).isRight,
      'Right because list of string was passed'
    );
    assert(
      Project.setProjectAuthors(['test', 142, 'asda'], {}).isLeft,
      'Left because list of mixed values was passed'
    );
    assert(
      Project.setProjectAuthors(123, {}).isLeft,
      'Left because not list of strings was passed'
    );
    assert(
      Project.setProjectAuthors('Vasya', {}).isLeft,
      'Left because not list of strings was passed'
    );
  });
});
