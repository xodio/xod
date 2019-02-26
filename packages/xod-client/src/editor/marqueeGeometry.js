import * as R from 'ramda';
import { isSegmentIntersected, isPointBetween } from 'line-intersection';

// Links
const isLineBetween = R.curry(
  (box, { from, to }) =>
    isPointBetween(from, box.from, box.to) &&
    isPointBetween(to, box.from, box.to)
);
const isLineIntersectsTop = (box, { from, to }) =>
  isSegmentIntersected([box.from, { x: box.to.x, y: box.from.y }, from, to]);
const isLineIntersectsRight = (box, { from, to }) =>
  isSegmentIntersected([
    { x: box.to.x, y: box.from.y },
    { x: box.to.x, y: box.to.y },
    from,
    to,
  ]);
const isLineIntersectsBottom = (box, { from, to }) =>
  isSegmentIntersected([
    { x: box.from.x, y: box.to.y },
    { x: box.to.x, y: box.to.y },
    from,
    to,
  ]);
const isLineIntersectsLeft = (box, { from, to }) =>
  isSegmentIntersected([
    { x: box.from.x, y: box.from.y },
    { x: box.from.x, y: box.to.y },
    from,
    to,
  ]);

// Nodes
const getNodeBoundBox = ({ pxPosition, pxSize }) => ({
  from: pxPosition,
  to: {
    x: pxPosition.x + pxSize.width,
    y: pxPosition.y + pxSize.height,
  },
});
const isNodeBetween = R.curry((box, node) => {
  const nodePoints = getNodeBoundBox(node);

  return (
    isPointBetween(nodePoints.from, box.from, box.to) &&
    isPointBetween(nodePoints.to, box.from, box.to)
  );
});
const isNodeIntersectedByBox = R.curry((box, node) => {
  const nodePoints = getNodeBoundBox(node);
  return (
    box.from.x <= nodePoints.to.x &&
    nodePoints.from.x <= box.to.x &&
    box.from.y <= nodePoints.to.y &&
    nodePoints.from.y <= box.to.y
  );
});

// Position utils
export const isInclusiveSelection = (startPos, endPos) => endPos.x < startPos.x;
export const getSelectionBox = (startPos, endPos) => ({
  from: {
    x: Math.min(startPos.x, endPos.x),
    y: Math.min(startPos.y, endPos.y),
  },
  to: {
    x: Math.max(startPos.x, endPos.x),
    y: Math.max(startPos.y, endPos.y),
  },
  width: Math.abs(startPos.x - endPos.x),
  height: Math.abs(startPos.y - endPos.y),
});

// Filters
export const filterLinksByBox = R.uncurryN(2, box =>
  R.filter(isLineBetween(box))
);
export const filterLinksByInclusiveBox = R.uncurryN(2, box =>
  R.filter(link =>
    R.anyPass([
      isLineBetween,
      isLineIntersectsTop,
      isLineIntersectsRight,
      isLineIntersectsBottom,
      isLineIntersectsLeft,
    ])(box, link)
  )
);

export const filterNodesByInclusiveBox = R.uncurryN(2, box =>
  R.filter(isNodeIntersectedByBox(box))
);
export const filterNodesByBox = R.uncurryN(2, box =>
  R.filter(isNodeBetween(box))
);
