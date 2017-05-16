import { expect } from 'chai';
import { Project } from 'xod-project';

import pack from '../src/pack';
import xodball from './fixtures/xodball.json';
import unpacked from './fixtures/unpacked.json';
import nodeTypesFixture from './fixtures/libs.json';

describe('Pack into xodball', () => {
  let packed;

  before(() => {
    packed = pack(unpacked, nodeTypesFixture);
  });

  it('should return a valid Project', () => {
    const eitherValidationResult = Project.validate(packed);
    expect(eitherValidationResult.isRight).to.be.equal(true);
  });

  it('should be equal to initial xodball', () => {
    expect(packed).to.deep.equal(xodball);
  });
});
