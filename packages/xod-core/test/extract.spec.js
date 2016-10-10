import { expect } from 'chai';
import * as Extract from '../src/utils/extract';
import xodball from './mocks/xodball.json';
import extracted from './mocks/extracted.json';

describe('Extract xodball', () => {
  it('should return project data, that contains meta and libs', () => {
    const projectMeta = Extract.project(xodball);
    expect(projectMeta).to.have.all.keys('meta', 'libs');
    expect(projectMeta).to.deep.equal(extracted[0].content);
  });

  it('should return same count of patches', () => {
    const patchesCount = Extract.patches(xodball).length;
    expect(patchesCount).to.be.equal((extracted.length - 1) / 2);
  });

  it('should return patches that contains meta and patch data', () => {
    const patches = Extract.patches(xodball);

    patches.forEach((patch, i) => {
      expect(patch).to.have.all.keys('meta', 'patch', 'path');
      expect(patch.meta).to.deep.equal(extracted[(i * 2) + 1].content);
      expect(patch.patch).to.deep.equal(extracted[(i * 2) + 2].content);
    });
  });

  it('should return correct project folder', () => {
    const projectPath = Extract.getProjectPath(xodball);
    expect(projectPath).to.be.equal('./awesome_project/');
  });

  it('should return correct patch folders', () => {
    const patches = xodball.patches;
    const patchKeys = Object.keys(patches);
    const paths = [];

    patchKeys.forEach(
      key => paths.push(Extract.patchPath(patches[key], xodball))
    );

    expect(paths).to.deep.equal([
      'main/',
      'sub/aux/',
    ]);
  });

  it('should return restructured data ready to be passed into saver', () => {
    const project = Extract.divided(xodball);
    expect(project).to.deep.equal(extracted);
  });
});
