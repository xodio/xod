import { assert } from 'chai';
import { initialState } from '../app/state';

describe('Initial state', () => {
  describe('node types', () => {
    it('cound must be > 0', () => {
      assert(Object.keys(initialState.nodeTypes).length > 0);
    });
  });
});
