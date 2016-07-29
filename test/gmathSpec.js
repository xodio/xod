
import { expect } from 'chai';
import { sortGraph } from 'utils/gmath';

describe('Graph math', () => {
  describe('Topological sorting', () => {
    it('should return [] for empty graph', () => {
      const sorted = sortGraph([], []);
      expect(sorted).to.be.eql([]);
    });

    it('should return single vertex for single-vertex graph', () => {
      const sorted = sortGraph([42], []);
      expect(sorted).to.be.eql([42]);
    });

    it('should return vertexes as is if there are no edges', () => {
      const sorted = sortGraph([42, 43, 44], []);
      expect(sorted).to.be.eql([42, 43, 44]);
    });

    it('should return vertexes as is if already sorted', () => {
      const sorted = sortGraph([42, 43, 44], [[42, 43], [43, 44]]);
      expect(sorted).to.be.eql([42, 43, 44]);
    });

    it('should return sorted vertexes if given vertexes are inversed', () => {
      const sorted = sortGraph([44, 43, 42], [[42, 43], [43, 44]]);
      expect(sorted).to.be.eql([42, 43, 44]);
    });
  });
});
