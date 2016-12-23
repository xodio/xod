import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import xodProject, { createProject } from '../src/index';

chai.use(dirtyChai);

describe('Index', () => {
  it('should contain named exports', () => {
    expect(createProject).to.be.a('function');
  });
  it('should contain default exports', () => {
    expect(xodProject)
      .to.be.an('object')
      .that.have.property('createProject')
      .that.is.a('function');
  });
});
