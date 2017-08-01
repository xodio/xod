import { expect } from 'chai';
import { Project } from 'xod-project';

import pack from '../src/pack';
import project from './fixtures/project.json';
import unpacked from './fixtures/unpacked.json';
import nodeTypesFixture from './fixtures/libs.json';

describe('Pack into project', () => {
  let packed;

  before(() => {
    packed = pack(unpacked, nodeTypesFixture);
  });

  it('should return a valid Project', () => {
    const eitherValidationResult = Project.validate(packed);
    expect(eitherValidationResult.isRight).to.be.equal(true);
  });

  it('should be equal to initial project', () => {
    expect(packed).to.deep.equal(project);
  });
});
