import { expect } from 'chai';
import { sortGraph } from '../src/gmath';

import { expectEither, expectErrorMessage } from './helpers';
import { ERROR } from '../src/constants';

describe('Graph math', () => {
  describe('Topological sorting', () => {
    it('should return [] for empty graph', () => {
      expectEither(sorted => {
        expect(sorted).to.be.eql([]);
      }, sortGraph([], []));
    });

    it('should return single vertex for single-vertex graph', () => {
      expectEither(sorted => {
        expect(sorted).to.be.eql([42]);
      }, sortGraph([42], []));
    });

    it('should return vertexes as is if there are no edges', () => {
      expectEither(sorted => {
        expect(sorted).to.be.eql([42, 43, 44]);
      }, sortGraph([42, 43, 44], []));
    });

    it('should return vertexes as is if already sorted', () => {
      expectEither(sorted => {
        expect(sorted).to.be.eql([42, 43, 44]);
      }, sortGraph([42, 43, 44], [[42, 43], [43, 44]]));
    });

    it('should return sorted vertexes if given vertexes are inversed', () => {
      expectEither(sorted => {
        expect(sorted).to.be.eql([42, 43, 44]);
      }, sortGraph([44, 43, 42], [[42, 43], [43, 44]]));
    });

    it('should throw error for cycled graph', () => {
      expectErrorMessage(
        expect,
        sortGraph([42, 43, 44], [[42, 43], [43, 42]]),
        ERROR.LOOPS_DETECTED
      );
    });

    it('should sort diamond graph', () => {
      expectEither(sorted => {
        expect(sorted).to.be.eql([42, 44, 43, 45]);
      }, sortGraph([44, 43, 42, 45], [[42, 43], [42, 44], [43, 45], [44, 45]]));
    });

    it('should sort clusters', () => {
      expectEither(sorted => {
        expect(sorted).to.be.eql([44, 42, 45, 43]);
      }, sortGraph([44, 43, 42, 45], [[42, 43], [44, 45]]));
    });
  });
});
