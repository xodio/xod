import { assert } from 'chai';

import { isAmong, uniqLists, swap } from '../src/lists';

describe('lists', () => {
  describe('isAmong', () => {
    it('returns true if list contains value', () => {
      assert.isTrue(isAmong([1, 2, 3], 2));
    });
    it('returns false if list does not contains value', () => {
      assert.isFalse(isAmong([1, 2, 3], 9));
    });
  });

  describe('uniqLists()', () => {
    it('returns filtered list', () => {
      assert.deepEqual(
        uniqLists([['a', 'b', 'c'], ['b', 'c', 'd'], ['a', 'd', 'e', 'f']]),
        [['a', 'b', 'c'], ['d'], ['e', 'f']]
      );
    });
    it('returns filtered list with untouched empty lists', () => {
      assert.deepEqual(uniqLists([['a', 'b', 'c'], ['b', 'c', 'd'], [], []]), [
        ['a', 'b', 'c'],
        ['d'],
        [],
        [],
      ]);
    });
    it('returns empty list for empty list', () => {
      assert.deepEqual(uniqLists([]), []);
    });
  });

  describe('swap()', () => {
    it('returns swapped list', () => {
      assert.deepEqual(swap(1, 3, ['a', 'b', 'c', 'd', 'e']), [
        'a',
        'd',
        'c',
        'b',
        'e',
      ]);
      assert.deepEqual(swap(4, 0, ['a', 'b', 'c', 'd', 'e']), [
        'e',
        'b',
        'c',
        'd',
        'a',
      ]);
    });
    it('throws an error if index is out of range', () => {
      assert.throws(() => swap(4, 0, ['a', 'b']), Error);
      assert.throws(() => swap(0, 4, ['a', 'b']), Error);
    });
  });
});
