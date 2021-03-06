import { assert } from 'chai';
import * as H from './helpers';
import * as XP from '../src';

// assume that nodes have an unique combination of
// type, label and position
const calculateNodeIdForStructuralComparison = node => {
  const type = XP.getNodeType(node);
  const label = XP.getNodeLabel(node);
  const position = XP.getNodePosition(node);

  return `${type}~~~${label}~~~${position.x}_${position.y}`;
};

describe('expandVariadicNodes', () => {
  it('expands a simple variadic patch', () => {
    const project = H.loadXodball('./fixtures/expanding.xodball');
    const expandedProject = XP.expandVariadicNodes('@/main', project);

    assert.deepEqual(
      XP.getPatchByPathUnsafe('@/my-variadic', expandedProject),
      XP.getPatchByPathUnsafe('@/my-variadic', project),
      'expanded patch should not change'
    );

    const expected = H.loadXodball('./fixtures/expanding.expected.xodball');

    assert.sameMembers(
      XP.listPatchPaths(expandedProject),
      XP.listPatchPaths(expected)
    );

    assert.deepEqual(
      XP.getPatchByPathUnsafe('@/main', expandedProject),
      XP.getPatchByPathUnsafe('@/main', expected),
      'expanded node type should be updated'
    );

    const expandedPatch = XP.getPatchByPathUnsafe(
      '@/my-variadic-$5',
      expandedProject
    );
    const expectedExpandedPatch = XP.getPatchByPathUnsafe(
      '@/my-variadic-$5',
      expected
    );

    H.assertPatchesAreStructurallyEqual(
      calculateNodeIdForStructuralComparison,
      expandedPatch,
      expectedExpandedPatch
    );
  });
});
