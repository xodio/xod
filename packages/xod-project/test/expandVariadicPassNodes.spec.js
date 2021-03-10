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

describe('expandVariadicPassNodes', () => {
  it('expands a variadic-pass patch', () => {
    const project = H.loadXodball('./fixtures/expanding-variadic-pass.xodball');
    const expandedProject = XP.expandVariadicPassNodes('@/main', project);

    assert.deepEqual(
      XP.getPatchByPathUnsafe('@/my-variadic-pass', expandedProject),
      XP.getPatchByPathUnsafe('@/my-variadic-pass', project),
      'expanded patch should not change'
    );

    const expected = H.loadXodball(
      './fixtures/expanding-variadic-pass.expected.xodball'
    );

    assert.sameMembers(
      XP.listPatchPaths(expandedProject),
      XP.listPatchPaths(expected)
    );

    assert.deepEqual(
      XP.getPatchByPathUnsafe('@/main', expandedProject),
      XP.getPatchByPathUnsafe('@/main', expected),
      'expanded node type should be updated'
    );

    H.assertPatchesAreStructurallyEqual(
      calculateNodeIdForStructuralComparison,
      XP.getPatchByPathUnsafe('@/my-variadic-pass-$4', expected),
      XP.getPatchByPathUnsafe('@/my-variadic-pass-$4', expected)
    );
    H.assertPatchesAreStructurallyEqual(
      calculateNodeIdForStructuralComparison,
      XP.getPatchByPathUnsafe('@/my-nested-variadic-pass-$4', expected),
      XP.getPatchByPathUnsafe('@/my-nested-variadic-pass-$4', expected)
    );
  });
});
