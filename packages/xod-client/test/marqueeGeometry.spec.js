import { assert } from 'chai';

import {
  isInclusiveSelection,
  getSelectionBox,
  filterLinksByBox,
  filterLinksByInclusiveBox,
  filterNodesByBox,
  filterNodesByInclusiveBox,
} from '../src/editor/marqueeGeometry';

describe('Maquee selecting geometry', () => {
  const box = {
    from: { x: 0, y: 0 },
    to: { x: 100, y: 100 },
  };
  const links = [
    { from: { x: 10, y: 10 }, to: { x: 30, y: 30 } },
    { from: { x: 10, y: 10 }, to: { x: 150, y: 150 } },
    { from: { x: 0, y: 0 }, to: { x: 90, y: 90 } },
    { from: { x: 120, y: 120 }, to: { x: 150, y: 150 } },
    { from: { x: -10, y: -10 }, to: { x: 110, y: 110 } },
  ];
  const nodes = [
    { pxPosition: { x: 10, y: 10 }, pxSize: { width: 90, height: 40 } },
    { pxPosition: { x: 10, y: 10 }, pxSize: { width: 40, height: 40 } },
    { pxPosition: { x: 0, y: 0 }, pxSize: { width: 40, height: 40 } },
    { pxPosition: { x: 120, y: 120 }, pxSize: { width: 40, height: 40 } },
    { pxPosition: { x: -10, y: -10 }, pxSize: { width: 140, height: 40 } },
  ];

  it('isInclusiveSelection() returns valid values', () => {
    assert.isFalse(
      isInclusiveSelection({ x: 0, y: 0 }, { x: 10, y: 10 }),
      'should be false, cause it selects from left to right (independent to Y value)'
    );
    assert.isFalse(
      isInclusiveSelection({ x: 0, y: 0 }, { x: 10, y: -10 }),
      'should be false, cause it selects from left to right (independent to Y value)'
    );
    assert.isTrue(
      isInclusiveSelection({ x: 0, y: 0 }, { x: -10, y: -10 }),
      'should be true, cause it selects from right to left (independent to Y value)'
    );
    assert.isTrue(
      isInclusiveSelection({ x: 0, y: 0 }, { x: -10, y: 10 }),
      'should be true, cause it selects from right to left (independent to Y value)'
    );
  });

  it('getSelectionBox() returns valid box object', () => {
    assert.deepEqual(getSelectionBox({ x: 0, y: 0 }, { x: 100, y: 50 }), {
      from: { x: 0, y: 0 },
      to: { x: 100, y: 50 },
      width: 100,
      height: 50,
    });
  });

  it('filters links only inside selection box', () => {
    assert.sameMembers(filterLinksByBox(box, links), [links[0], links[2]]);
  });
  it('filters links that inside selection box or collides with it', () => {
    assert.sameMembers(filterLinksByInclusiveBox(box, links), [
      links[0],
      links[1],
      links[2],
      links[4],
    ]);
  });
  it('filters nodes only inside selection box', () => {
    assert.sameMembers(filterNodesByBox(box, nodes), [
      nodes[0],
      nodes[1],
      nodes[2],
    ]);
  });
  it('filters nodes that inside selection box or collides with it', () => {
    assert.sameMembers(filterNodesByInclusiveBox(box, nodes), [
      nodes[0],
      nodes[1],
      nodes[2],
      nodes[4],
    ]);
  });
});
