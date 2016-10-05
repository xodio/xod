import { expect } from 'chai';
import * as Extract from '../src/fs/extract';
import xodball from './mocks/xodball.json';
import extracted from './mocks/extracted.json';

describe('Extract xodball', () => {
  it('should return restructure project data', () => {
    const project = Extract.all(xodball);
    expect(project).to.have.all.keys('project', 'patches');
    expect(project).to.deep.equal(extracted);
  });

  it('should return project data, that contains meta and libs', () => {
    const projectMeta = Extract.project(xodball);
    expect(projectMeta).to.have.all.keys('meta', 'libs');
    expect(projectMeta).to.deep.equal(extracted.project);
  });

  it('should return same count of patches', () => {
    const patchesCount = Extract.patches(xodball).length;
    expect(patchesCount).to.be.equal(extracted.patches.length);
  });

  it('should return patches that contains meta and patch data', () => {
    const patches = Extract.patches(xodball);

    patches.forEach((patch, i) => {
      expect(patch).to.have.all.keys('meta', 'patch', 'path');
      expect(patch).to.deep.equal(extracted.patches[i]);
    });
  });
});
