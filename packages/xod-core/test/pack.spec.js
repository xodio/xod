import { expect } from 'chai';
import pack from '../src/utils/pack';
import xodball from './fixtures/xodball.json';
import unpacked from './fixtures/unpacked.json';

describe('Pack into xodball', () => {
  it('should return project state with keys: meta, patches, nodeTypes and folders', () => {
    const project = pack(unpacked);
    expect(project).to.have.all.keys('meta', 'patches', 'nodeTypes', 'folders');
  });

  it('should return project meta with keys: name, author and to be equal with xodball.meta', () => {
    const projectMeta = pack(unpacked);
    expect(projectMeta).to.have.all.keys('name', 'author');
    expect(projectMeta.meta).to.deep.eql(xodball.meta);
  });

  it('should return same patches as initial xodball has', () => {
    const patches = pack(unpacked).patches;
    expect(patches).to.deep.equal(xodball.patches);
  });

  it('should return same nodeTypes as initial xodball has', () => {
    const nodeTypes = pack(unpacked).nodeTypes;
    expect(nodeTypes).to.deep.equal(xodball.nodeTypes);
  });

  it('should return patches that have keys: id, folderId, label, nodes, links', () => {
    const patches = pack(unpacked).patches;

    patches.forEach((patch) => {
      expect(patch).to.have.all.keys('id', 'folderId', 'label', 'nodes', 'links');
      expect(patch.id).to.not.be.eql(null);
      expect(patch.label).to.not.be.eql(null);
      expect(patch.nodes).to.be.an('object');
      expect(patch.links).to.be.an('object');
    });
  });

  it('should be completely equal to initial xodball', () => {
    const project = pack(unpacked);
    expect(project).to.deep.equal(xodball);
  });
});
