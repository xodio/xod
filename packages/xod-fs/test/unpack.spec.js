import R from 'ramda';
import { expect } from 'chai';
import { isLocalID } from '../src/utils';
import * as Unpack from '../src/unpack';
import xodball from './fixtures/xodball.json';
import unpacked from './fixtures/unpacked.json';

describe('Unpack xodball', () => {
  it('should return project data, that contains meta and libs', () => {
    const projectMeta = Unpack.extractProject(xodball);
    expect(projectMeta).to.have.all.keys('meta', 'libs');
    expect(projectMeta).to.deep.equal(unpacked[0].content);
  });

  it('should return same count of patches', () => {
    const patchesCount = Unpack.extractPatches(xodball).length;
    expect(patchesCount).to.be.equal((unpacked.length - 1) / 2);
  });

  it('should return patches that contains meta and patch data', () => {
    const patches = Unpack.extractPatches(xodball);

    patches.forEach((patch, i) => {
      expect(patch).to.have.all.keys('meta', 'patch', 'path');
      expect(patch.meta).to.deep.equal(unpacked[(i * 2) + 1].content);
      expect(patch.patch).to.deep.equal(unpacked[(i * 2) + 2].content);
    });
  });

  it('should return correct project folder', () => {
    const projectPath = Unpack.getProjectPath(xodball);
    expect(projectPath).to.be.equal('./awesome-project/');
  });

  it('should return correct patch folders', () => {
    const patches = R.pipe(
      R.values,
      R.filter(
        R.pipe(
          R.prop('id'),
          isLocalID
        )
      ),
      R.indexBy(R.prop('id'))
    )(xodball.patches);
    const patchKeys = Object.keys(patches);
    const paths = [];

    patchKeys.forEach(
      key => paths.push(Unpack.getPatchPath(patches[key], xodball))
    );

    expect(paths).to.deep.equal([
      'main/',
      'sub/qux/',
    ]);
  });

  it('should return restructured data ready to be passed into saver', () => {
    const project = Unpack.arrangeByFiles(xodball);
    expect(project).to.deep.equal(unpacked);
  });
});
