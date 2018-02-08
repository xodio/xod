
import { expect } from 'chai';
import { sortGraph } from '../src/gmath';

import { expectEitherRight, expectEitherError } from './helpers';
import { ERROR } from '../src/constants';

describe('Graph math', () => {
  describe('Topological sorting', () => {
    it('should return [] for empty graph', () => {
      expectEitherRight(
        (sorted) => { expect(sorted).to.be.eql([]); },
        sortGraph([], [])
      );
    });

    it('should return single vertex for single-vertex graph', () => {
      expectEitherRight(
        (sorted) => { expect(sorted).to.be.eql([42]); },
        sortGraph([42], [])
      );
    });

    it('should return vertexes as is if there are no edges', () => {
      expectEitherRight(
        (sorted) => { expect(sorted).to.be.eql([42, 43, 44]); },
        sortGraph([42, 43, 44], [])
      );
    });

    it('should return vertexes as is if already sorted', () => {
      expectEitherRight(
        (sorted) => { expect(sorted).to.be.eql([42, 43, 44]); },
        sortGraph([42, 43, 44], [[42, 43], [43, 44]])
      );
    });

    it('should return sorted vertexes if given vertexes are inversed', () => {
      expectEitherRight(
        (sorted) => { expect(sorted).to.be.eql([42, 43, 44]); },
        sortGraph([44, 43, 42], [[42, 43], [43, 44]])
      );
    });

    it('should throw error for cycled graph', () => {
      expectEitherError(
        ERROR.LOOPS_DETECTED,
        sortGraph([42, 43, 44], [[42, 43], [43, 42]])
      );
    });

    it('should sort diamond graph', () => {
      expectEitherRight(
        (sorted) => { expect(sorted).to.be.eql([42, 44, 43, 45]); },
        sortGraph([44, 43, 42, 45], [[42, 43], [42, 44], [43, 45], [44, 45]])
      );
    });

    it('should sort clusters', () => {
      expectEitherRight(
        (sorted) => { expect(sorted).to.be.eql([44, 42, 45, 43]); },
        sortGraph([44, 43, 42, 45], [[42, 43], [44, 45]])
      );
    });
  });
});
