import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import * as XP from 'xod-project';
import { foldMaybe } from 'xod-func-tools';

export const BASE_SIZE_UNIT = 5;

export const NODE_HEIGHT = BASE_SIZE_UNIT * 13;

const GAP_BETWEEN_LINES = BASE_SIZE_UNIT * 8;

export const SLOT_SIZE = {
  WIDTH: BASE_SIZE_UNIT * 8 + 4,
  HEIGHT: NODE_HEIGHT + GAP_BETWEEN_LINES,
  GAP: GAP_BETWEEN_LINES,
};

export const GAP_IN_SLOTS = SLOT_SIZE.GAP / SLOT_SIZE.HEIGHT;

const PINVALUE_GAP = 4;
export const PINVALUE_WIDTH = SLOT_SIZE.WIDTH - PINVALUE_GAP / 2;

const PINLABEL_GAP = 8;
export const PINLABEL_WIDTH = SLOT_SIZE.WIDTH - PINLABEL_GAP / 2;

export const DEFAULT_PANNING_OFFSET = {
  x: 1.5, // In slots
  y: 0.75, // In slots
};

export const LINK_HOTSPOT_SIZE = {
  WIDTH: 8,
};

export const NODE_CORNER_RADIUS = 3;

export const RESIZE_HANDLE_SIZE = 12;
export const VARIADIC_HANDLE_WIDTH = 4;
export const VARIADIC_HANDLE_HEIGHT = BASE_SIZE_UNIT * 5;

export const PIN_RADIUS = 4;
export const PIN_INNER_RADIUS = PIN_RADIUS - 2;
export const PIN_RADIUS_WITH_OUTER_STROKE = PIN_RADIUS + 3;
export const PIN_RADIUS_WITH_SHADOW = PIN_RADIUS + 4; // TODO: rename
export const PIN_HIGHLIGHT_RADIUS = 15;
export const PIN_HOVER_HIGHLIGHT_RADIUS = PIN_RADIUS;
export const PIN_HOTSPOT_RADIUS = PIN_HIGHLIGHT_RADIUS;
export const PIN_OFFSET_FROM_NODE_EDGE = 0;

export const TEXT_OFFSET_FROM_PIN_BORDER = 3;

// =============================================================================
//
// Position / Size converters
//
// =============================================================================

// :: Size -> Size
export const pixelSizeToSlots = R.evolve({
  width: px => px / SLOT_SIZE.WIDTH,
  height: px => px / SLOT_SIZE.HEIGHT,
});

// :: Size -> Size
export const slotSizeToPixels = R.evolve({
  width: slots => slots * SLOT_SIZE.WIDTH,
  height: slots => R.dec(slots) * SLOT_SIZE.HEIGHT + NODE_HEIGHT,
});

// :: Position -> Position
export const pixelPositionToSlots = R.evolve({
  x: px => px / SLOT_SIZE.WIDTH,
  y: px => px / SLOT_SIZE.HEIGHT,
});

// :: Position -> Position
export const slotPositionToPixels = R.evolve({
  x: slots => Math.ceil(slots * SLOT_SIZE.WIDTH),
  y: slots => Math.ceil(slots * SLOT_SIZE.HEIGHT),
});

// =============================================================================
//
// Node layout calculations
//
// =============================================================================

// :: { input: Number, output: Number } -> Size
const nodeSizeByPinsInSlots = pinCountByDirection => ({
  width: Math.max(pinCountByDirection.input, pinCountByDirection.output, 1),
  height: 1,
});

// :: [Pin] -> Size
export const calcutaleNodeSizeFromPins = R.compose(
  nodeSizeByPinsInSlots,
  R.map(R.length),
  R.merge({ input: [], output: [] }),
  R.groupBy(R.prop('direction'))
);

// :: Number -> Number -> Position
const pinOrderToPosition = R.curry((nodeWidth, pinOrder) => ({
  x: pinOrder * SLOT_SIZE.WIDTH + SLOT_SIZE.WIDTH / 2,
  y: PIN_OFFSET_FROM_NODE_EDGE,
}));

// :: Size -> Pin -> Position
export const calculatePinPosition = R.curry((nodeSize, pin) => {
  const position = pinOrderToPosition(nodeSize.width, pin.order);

  // output pin positions start from the bottom
  return R.when(
    R.always(R.equals(pin.direction, 'output')),
    R.assoc('y', nodeSize.height - position.y)
  )(position);
});

/**
 * adds `size` to node and `position` to node's pins
 * @param node - dereferenced node
 */
export const addNodePositioning = node => {
  const calculatedSize = R.compose(
    slotSizeToPixels,
    calcutaleNodeSizeFromPins,
    R.values
  )(node.pins);
  const sizeInPx = slotSizeToPixels(node.size);
  const pxSize = {
    width: Math.max(calculatedSize.width, sizeInPx.width),
    height: Math.max(calculatedSize.height, sizeInPx.height),
  };

  const pxPosition = slotPositionToPixels(node.position);

  const pins = R.map(pin => {
    const pinPosition = calculatePinPosition(pxSize, pin);
    return R.merge(pin, { position: pinPosition });
  }, node.pins);

  return R.merge(node, {
    pxSize,
    pxPosition,
    pins,
    originalSize: calculatedSize,
  });
};

export const addNodesPositioning = R.map(addNodePositioning);

export const addPoints = R.curry((a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
}));

export const subtractPoints = R.curry((a, b) => ({
  x: a.x - b.x,
  y: a.y - b.y,
}));

/**
 * @param nodes — dereferenced nodes with added positioning data
 * @param links - dereferenced links
 */
export const addLinksPositioning = nodes =>
  R.map(link => {
    const { input, output } = R.map(
      pin =>
        R.assoc('position', nodes[pin.nodeId].pins[pin.pinKey].position, pin),
      R.pick(['input', 'output'], link)
    );
    return R.merge(link, {
      from: addPoints(nodes[input.nodeId].pxPosition, input.position) || null,
      to: addPoints(nodes[output.nodeId].pxPosition, output.position) || null,
    });
  });

// ============= snapping to slots grid ===================
/**
 * get position in slots
 */
export const nodePositionInPixelsToSlots = R.evolve({
  x: x => Math.floor(x / SLOT_SIZE.WIDTH),
  y: y => Math.floor(y / SLOT_SIZE.HEIGHT),
});

export const pointToSize = ({ x, y }) => ({ width: x, height: y });

export const sizeToPoint = ({ width, height }) => ({ x: width, y: height });

// Position :: { x: Number, y: Number }
// :: Position -> Position
export const snapPositionToSlots = R.compose(
  slotPositionToPixels,
  nodePositionInPixelsToSlots
);

/**
 * @param node position
 * @return node position snapped to slots grid
 */
export const snapNodePositionToSlots = R.compose(
  snapPositionToSlots,
  addPoints({ x: SLOT_SIZE.WIDTH / 2, y: SLOT_SIZE.HEIGHT / 2 })
);

export const snapNodeSizeToSlots = R.compose(
  slotSizeToPixels,
  pointToSize,
  nodePositionInPixelsToSlots,
  addPoints({ x: SLOT_SIZE.WIDTH * 0.75, y: SLOT_SIZE.HEIGHT * 1.1 }),
  sizeToPoint
);

// :: ([Number] -> Number) -> ([Number] -> Number) -> [Position] -> Maybe Position
export const findPosition = R.uncurryN(3)((xFn, yFn) =>
  R.ifElse(
    R.isEmpty,
    R.always(Maybe.Nothing()),
    R.compose(
      Maybe.Just,
      R.converge((x, y) => ({ x, y }), [
        R.compose(xFn, R.map(R.prop('x'))),
        R.compose(yFn, R.map(R.prop('y'))),
      ])
    )
  )
);

// :: [Position] -> Maybe Position
export const getTopLeftPosition = findPosition(
  R.apply(Math.min),
  R.apply(Math.min)
);

// :: [Position] -> Maybe Position
export const getBottomRightPosition = findPosition(
  R.apply(Math.max),
  R.apply(Math.max)
);

// Given a list of positions of all entities, returns optimal patch panning offset
// :: [Position] -> Position
export const getOptimalPanningOffset = R.compose(
  foldMaybe(
    DEFAULT_PANNING_OFFSET,
    R.pipe(R.map(R.negate), addPoints(DEFAULT_PANNING_OFFSET))
  ),
  getTopLeftPosition
);

// :: Node -> Pin -> Position
export const getBusNodePositionForPin = (node, pin) => {
  const nodePosition = XP.getNodePosition(node);
  const pinDirection = XP.getPinDirection(pin);
  const pinOrder = XP.getPinOrder(pin);

  return {
    x: nodePosition.x + pinOrder * SLOT_SIZE.WIDTH,
    y:
      nodePosition.y +
      SLOT_SIZE.HEIGHT * (pinDirection === XP.PIN_DIRECTION.INPUT ? -1 : 1),
  };
};

// :: Number -> Boolean -> PIN_DIRECTION -> { x: Number, y: Number } -> { x, y, width, height }
const getPinTextProps = (width, isLabel, direction, position) => {
  const FONT_HEIGHT = 11;
  const isAboveNodeBorder = direction === XP.PIN_DIRECTION.OUTPUT || !isLabel;
  const compensateFontHeight = isAboveNodeBorder ? FONT_HEIGHT : 0;
  const offsetFromNodeBorder =
    (PIN_RADIUS + TEXT_OFFSET_FROM_PIN_BORDER) * (isAboveNodeBorder ? -1 : 1);

  return {
    x: position.x - width / 2,
    y: position.y - compensateFontHeight + offsetFromNodeBorder,
    width,
    height: FONT_HEIGHT,
  };
};

// :: PIN_DIRECTION -> { x: Number, y: Number } -> { x, y, width, height }
export const getPinValueProps = (pinDirection, position) =>
  getPinTextProps(PINVALUE_WIDTH, false, pinDirection, position);

// :: PIN_DIRECTION -> { x: Number, y: Number } -> { x, y, width, height }
export const getPinLabelProps = (pinDirection, position) =>
  getPinTextProps(PINLABEL_WIDTH, true, pinDirection, position);
