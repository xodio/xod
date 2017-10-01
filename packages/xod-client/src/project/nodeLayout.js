import R from 'ramda';

const BASE_SIZE_UNIT = 17;

export const SLOT_SIZE = {
  WIDTH: BASE_SIZE_UNIT * 2,
  HEIGHT: BASE_SIZE_UNIT * 6,
};

export const NODE_HEIGHT = BASE_SIZE_UNIT * 3;

export const DEFAULT_PANNING_OFFSET = {
  x: NODE_HEIGHT,
  y: NODE_HEIGHT,
};

export const LINK_HOTSPOT_SIZE = {
  WIDTH: 8,
};

export const NODE_CORNER_RADIUS = 5;

export const PIN_RADIUS = 6;
export const PIN_RADIUS_WITH_OUTER_STROKE = PIN_RADIUS + 2;
export const PIN_RADIUS_WITH_SHADOW = PIN_RADIUS + 4; // TODO: rename
export const PIN_HIGHLIGHT_RADIUS = 15;
export const PIN_OFFSET_FROM_NODE_EDGE = 3;

export const TEXT_OFFSET_FROM_PIN_BORDER = 10;

// :: { input: Number, output: Number } -> Size
const nodeSizeInSlots = pinCountByDirection => ({
  width: Math.max(pinCountByDirection.input, pinCountByDirection.output, 1),
  height: 1,
});

/**
 * converts size in slots to size in pixels
 */
// :: Size -> Size
export const nodeSizeInSlotsToPixels = R.evolve({
  width: slots => slots * SLOT_SIZE.WIDTH,
  height: slots => (R.dec(slots) * SLOT_SIZE.HEIGHT) + NODE_HEIGHT,
});

// :: [Pin] -> Size
export const calcutaleNodeSizeFromPins = R.compose(
  nodeSizeInSlotsToPixels,
  nodeSizeInSlots,
  R.map(R.length),
  R.merge({ input: [], output: [] }),
  R.groupBy(R.prop('direction')),
);

// :: Number -> Number -> Position
const pinOrderToPosition = R.curry(
  (nodeWidth, pinOrder) => ({
    x: (pinOrder * SLOT_SIZE.WIDTH) + (SLOT_SIZE.WIDTH / 2),
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
export const addNodePositioning = (node) => {
  const size = R.compose(
    calcutaleNodeSizeFromPins,
    R.values
  )(node.pins);

  const pins = R.map(
    (pin) => {
      const position = calculatePinPosition(size, pin);
      return R.merge(pin, { position });
    },
    node.pins
  );

  return R.merge(node, { size, pins });
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
  R.map((link) => {
    const { input, output } = R.map(
      pin => R.assoc(
        'position',
        nodes[pin.nodeId].pins[pin.pinKey].position,
        pin
      ),
      R.pick(['input', 'output'], link)
    );

    return R.merge(
      link,
      {
        from: addPoints(nodes[input.nodeId].position, input.position) || null,
        to: addPoints(nodes[output.nodeId].position, output.position) || null,
      }
    );
  });

// ============= snapping to slots grid ===================
/**
 * get position in slots
 */
export const nodePositionInPixelsToSlots = R.evolve({
  x: x => Math.floor(x / SLOT_SIZE.WIDTH),
  y: y => Math.floor(y / SLOT_SIZE.HEIGHT),
});

/**
 * convert position in slots to pixels
 */
export const slotPositionToPixels = ({ x, y }) => ({
  x: x * SLOT_SIZE.WIDTH,
  y: y * SLOT_SIZE.HEIGHT,
});

export const pointToSize = ({ x, y }) => ({ width: x, height: y });

export const sizeToPoint = ({ width, height }) => ({ x: width, y: height });

/**
 * @param node position
 * @return node position snapped to slots grid
 */
export const snapNodePositionToSlots = R.compose(
  slotPositionToPixels,
  nodePositionInPixelsToSlots,
  addPoints({ x: SLOT_SIZE.WIDTH / 2, y: SLOT_SIZE.HEIGHT / 2 })
);

export const snapNodeSizeToSlots = R.compose(
  nodeSizeInSlotsToPixels,
  pointToSize,
  nodePositionInPixelsToSlots,
  addPoints({ x: SLOT_SIZE.WIDTH * 0.75, y: SLOT_SIZE.HEIGHT * 1.1 }),
  sizeToPoint
);

// :: [Position] -> Position
export const getBoundingBoxPosition = R.converge(
  (x, y) => ({ x, y }),
  [
    R.compose(R.head, R.sort(R.subtract), R.map(R.prop('x'))),
    R.compose(R.head, R.sort(R.subtract), R.map(R.prop('y'))),
  ]
);

// Given a list of positions of all entities, returns optimal patch panning offset
// :: [Position] -> Position
export const getOptimalPanningOffset = R.ifElse(
  R.isEmpty,
  R.always(DEFAULT_PANNING_OFFSET),
  R.compose(
    addPoints(DEFAULT_PANNING_OFFSET),
    R.map(R.negate),
    getBoundingBoxPosition
  )
);
