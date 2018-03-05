import { assert } from 'chai';
import { defaultizePatch } from 'xod-project/test/helpers';

import {
  calculateAdded,
  calculateDeleted,
  calculateModified,
  calculateDiff,
} from '../src/patchDiff';

describe('Patch diffs', () => {
  const patchA = defaultizePatch({
    path: '@/a',
    nodes: { a: { id: 'a' }, b: { id: 'b' } },
  });
  const patchB = defaultizePatch({
    path: '@/b',
    nodes: { a: { id: 'a' } },
  });
  const patchBNew = defaultizePatch({
    path: '@/b',
    nodes: { b: { id: 'b' } },
  });
  const patchC = defaultizePatch({
    path: '@/c',
    nodes: { a: { id: 'a' } },
  });
  const patchD = defaultizePatch({
    path: '@/d',
    nodes: {},
  });

  const before = [patchA, patchB, patchC];
  const after = [patchA, patchBNew, patchD];

  it('calculateAdded() returns correct results', () =>
    assert.sameMembers(calculateAdded(before, after).map(a => a.path), [
      '@/d',
    ]));
  it('calculateModified() returns correct results', () =>
    assert.sameMembers(calculateModified(before, after).map(a => a.path), [
      '@/b',
    ]));
  it('calculateDeleted() returns correct results', () =>
    assert.sameMembers(calculateDeleted(before, after).map(a => a.path), [
      '@/c',
    ]));
  it('calculateDiff() returns correct results', () =>
    assert.sameMembers(calculateDiff(before, after).map(a => a.path), [
      '@/d',
      '@/b',
      '@/c',
    ]));
});
