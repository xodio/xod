import R from 'ramda';
import { expect } from 'chai';
import pack from '../src/utils/pack';
import xodball from './fixtures/xodball.json';
import unpacked from './fixtures/unpacked.json';

const equalPatchesExceptFolderId = (expected, actual) => {
  const replaceFolderId = R.map(R.assoc('folderId', 'test'));
  expect(replaceFolderId(expected)).to.deep.equal(replaceFolderId(actual));
};

const equalFolders = (expected, actual) => {
  const numIds = initialFolders => {
    let id = 0;
    const accordance = {};

    return R.pipe(
      R.values,
      R.sortBy(R.prop('name')),
      R.map(
        folder => {
          id += 1;
          accordance[folder.id] = id;
          return R.assoc('id', id, folder);
        }
      ),
      R.map(
        folder => {
          if (folder.parentId === null) {
            return folder;
          }
          return R.assoc('parentId', accordance[folder.parentId], folder);
        }
      )
    )(initialFolders);
  };

  expect(numIds(expected)).to.deep.equal(numIds(actual));
};

describe('Pack into xodball', () => {
  it('should return project state with keys: meta, patches, nodeTypes and folders', () => {
    const project = pack(unpacked);
    expect(project).to.have.all.keys('meta', 'patches', 'nodeTypes', 'folders');
  });

  it('should return project meta with keys: name, author and to be equal with xodball.meta', () => {
    const projectMeta = pack(unpacked).meta;
    expect(projectMeta).to.have.all.keys('name', 'author');
    expect(projectMeta).to.deep.eql(xodball.meta);
  });

  it('should return same patches as initial xodball has', () => {
    const patches = pack(unpacked).patches;
    equalPatchesExceptFolderId(patches, xodball.patches);
  });

  it('should return same nodeTypes as initial xodball has', () => {
    const nodeTypes = pack(unpacked).nodeTypes;
    expect(nodeTypes).to.deep.equal(xodball.nodeTypes);
  });

  it('should return patches that have keys: id, folderId, label, nodes, links', () => {
    const patches = pack(unpacked).patches;
    const patchKeys = Object.keys(patches);

    patchKeys.forEach((key) => {
      const patch = patches[key];

      expect(patch).to.have.all.keys('id', 'folderId', 'label', 'nodes', 'links');
      expect(patch.id).to.not.be.eql(null);
      expect(patch.label).to.not.be.eql(null);
      expect(patch.nodes).to.be.an('object');
      expect(patch.links).to.be.an('object');
    });
  });

  it('should be equal to initial xodball, except folderIds', () => {
    const project = pack(unpacked);

    expect(project.meta).to.deep.equal(xodball.meta);
    equalPatchesExceptFolderId(project.patches, xodball.patches);
    equalFolders(project.folders, xodball.folders);
    expect(project.nodeTypes).to.deep.equal(xodball.nodeTypes);
  });
});
