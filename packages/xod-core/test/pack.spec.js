import R from 'ramda';
import { expect } from 'chai';
import pack from '../src/utils/pack';
import { numerateFolders, replaceFolderId } from '../src/utils/test';
import xodball from './fixtures/xodball.json';
import unpacked from './fixtures/unpacked.json';
import nodeTypesFixture from './fixtures/libs.json';

describe('Pack into xodball', () => {
  let packed;

  before(() => {
    packed = pack(unpacked, nodeTypesFixture);
  });

  it('should return project state with keys: meta, patches, nodeTypes and folders', () => {
    expect(packed).to.have.all.keys('meta', 'patches', 'nodeTypes', 'folders');
  });

  it('should return project meta with keys: name, author and to be equal with xodball.meta', () => {
    const projectMeta = packed.meta;
    expect(projectMeta).to.have.all.keys('name', 'author');
    expect(projectMeta).to.deep.eql(xodball.meta);
  });

  it('should return same patches as initial xodball has', () => {
    expect(replaceFolderId(packed.patches)).to.deep.equal(replaceFolderId(xodball.patches));
  });

  it('should return same nodeTypes as initial xodball has', () => {
    const nodeTypes = packed.nodeTypes;
    expect(nodeTypes).to.deep.equal(xodball.nodeTypes);
  });

  it('should return patches that have keys: id, folderId, label, nodes, links', () => {
    const patches = packed.patches;
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
    expect(packed.meta).to.deep.equal(xodball.meta);
    expect(replaceFolderId(packed.patches)).to.deep.equal(replaceFolderId(xodball.patches));
    expect(numerateFolders(packed.folders)).to.deep.equal(numerateFolders(xodball.folders));
    expect(packed.nodeTypes).to.deep.equal(xodball.nodeTypes);
  });
});
