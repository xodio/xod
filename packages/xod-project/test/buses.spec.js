import R from 'ramda';

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

describe('buses', () => {
  describe('jumperizePatchRecursively', () => {
    it('replaces bus nodes with links', () => {
      const project = H.loadXodball('./fixtures/jumperize.xodball');

      const actualProject = XP.jumperizePatchRecursively('@/main', project);

      const expectedProject = H.loadXodball(
        './fixtures/jumperize.expected.xodball'
      );

      H.assertPatchesAreStructurallyEqual(
        calculateNodeIdForStructuralComparison,
        XP.getPatchByPathUnsafe('@/main', actualProject),
        XP.getPatchByPathUnsafe('@/main', expectedProject)
      );
    });
  });

  describe('splitLinksToBuses', () => {
    const getBusNodePositionForPin = (node, pin) => {
      const nodePosition = XP.getNodePosition(node);
      const pinDirection = XP.getPinDirection(pin);
      const pinOrder = XP.getPinOrder(pin);

      return {
        x: nodePosition.x + pinOrder,
        y: nodePosition.y + pinDirection === XP.PIN_DIRECTION.INPUT ? -1 : 1,
      };
    };

    it('splits links with given ids to buses', () => {
      const project = H.loadXodball('./fixtures/split-links-to-buses.xodball');

      const allLinkIds = R.compose(
        R.map(XP.getLinkId),
        XP.listLinks,
        XP.getPatchByPathUnsafe('@/main')
      )(project);

      const actualProject = XP.splitLinksToBuses(
        getBusNodePositionForPin,
        '@/main',
        allLinkIds,
        project
      );

      const expectedProject = H.loadXodball(
        './fixtures/split-links-to-buses.expected.xodball'
      );

      H.assertPatchesAreStructurallyEqual(
        calculateNodeIdForStructuralComparison,
        XP.getPatchByPathUnsafe('@/main', actualProject),
        XP.getPatchByPathUnsafe('@/main', expectedProject)
      );
    });
  });
});
