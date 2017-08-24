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

/**
 * @param {number} inputPinCount
 * @param {number} outputPinCount
 * @returns {{width: number, height: number}} - horizontal and vertical slots needed for node
 */
export const nodeSizeInSlots = (inputPinCount, outputPinCount) => ({
  width: Math.max(inputPinCount, outputPinCount),
  height: 1,
});

export const slotsWidthInPixels = slots => slots * SLOT_SIZE.WIDTH;

export const slotsHeightInPixels = slots => (R.dec(slots) * SLOT_SIZE.HEIGHT) + NODE_HEIGHT;

/**
 * converts size in slots to size in pixels
 */
export const slotsToPixels = R.evolve({
  width: slotsWidthInPixels,
  height: slotsHeightInPixels,
});

export const relativePinPosition = R.curry((rows, pinIndex) => {
  const pinsInFullRow = R.head(rows);
  const rowIndex = Math.floor(pinIndex / pinsInFullRow);
  const indexInRow = pinIndex - (rowIndex * pinsInFullRow);
  const totalPinsInRow = rows[rowIndex];

  return {
    rowIndex,
    indexInRow,
    totalPinsInRow,
  };
});

/**
 * pin center position in pixels relative to pins group(input or output)
 */
export const relativePinPositionToPixels = R.curry(
  (nodeWidth, pinOrder) => ({
    x: (pinOrder * SLOT_SIZE.WIDTH) + (SLOT_SIZE.WIDTH / 2),
    y: PIN_OFFSET_FROM_NODE_EDGE,
  }));

/**
 * adds `size` to node and `position` to node's pins
 * @param node - dereferenced node
 */
export const addNodePositioning = (node) => {
  const pinCountByDirection = R.compose(
    R.map(R.length),
    R.merge({ input: [], output: [] }),
    R.groupBy(R.prop('direction')),
    R.values
  )(node.pins);

  const sizeInSlots = nodeSizeInSlots(
    pinCountByDirection.input,
    pinCountByDirection.output
  );

  const size = slotsToPixels(sizeInSlots);

  const pins = R.map(
    (pin) => {
      const relPxPosition = relativePinPositionToPixels(size.width, pin.order);

      // output pin positions start from the bottom
      const position = R.when(
        R.always(R.equals(pin.direction, 'output')),
        R.assoc('y', size.height - relPxPosition.y)
      )(relPxPosition);

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

export const getSlotRow = y => Math.floor(y / SLOT_SIZE.HEIGHT);
export const getSlotColumn = x => Math.floor(x / SLOT_SIZE.WIDTH);

/**
 * get position in slots
 */
export const getSlotPosition = R.evolve({
  x: getSlotColumn,
  y: getSlotRow,
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
  getSlotPosition,
  addPoints({ x: SLOT_SIZE.WIDTH / 2, y: SLOT_SIZE.HEIGHT / 2 })
);

export const snapNodeSizeToSlots = R.compose(
  slotsToPixels,
  pointToSize,
  getSlotPosition,
  addPoints({ x: SLOT_SIZE.WIDTH * 0.75, y: SLOT_SIZE.HEIGHT * 1.1 }),
  sizeToPoint
);

// TODO: works only for 1x1 nodes
export const isValidPosition = (allNodes, draggedNodeId, snappedPosition) =>
  R.compose(
    R.none(
      R.compose(
        R.equals(snappedPosition),
        R.prop('position')
      )
    ),
    R.values,
    R.omit(draggedNodeId)
  )(allNodes);

// Given a list of positions of all entities, returns optimal patch panning offset
// :: [Position] -> Position
export const getOptimalPanningOffset = R.ifElse(
  R.isEmpty,
  R.always(DEFAULT_PANNING_OFFSET),
  R.compose(
    addPoints(DEFAULT_PANNING_OFFSET),
    R.map(R.negate),
    R.converge(
      (x, y) => ({ x, y }),
      [
        R.compose(R.head, R.sort(R.subtract), R.map(R.prop('x'))),
        R.compose(R.head, R.sort(R.subtract), R.map(R.prop('y'))),
      ]
    )
  )
);
