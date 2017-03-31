import R from 'ramda';

export const MAX_PINS_IN_ROW = 17;

export const SLOT_SIZE = {
  WIDTH: 108,
  HEIGHT: 72,
};
export const SLOT_MARGIN = {
  HORIZONTAL: 20,
  VERTICAL: 32,
};

export const PIN_SIZE = { // including label, etc
  WIDTH: 22,
  HEIGHT: 20,
};
export const PIN_MARGIN = {
  VERTICAL: 5,
};

export const NODE_CORNER_RADIUS = 5;
export const PIN_RADIUS = 6;
export const TEXT_OFFSET_FROM_PIN_BORDER = 10;

/**
 * @param {number} pinCount
 * @returns {number} - how many rows is needed for a given number of pins
 */
export const rowCountForPins = pinCount =>
  Math.ceil(pinCount / MAX_PINS_IN_ROW);

/**
 * @param {number} pinCount
 * @returns {number[]} - number of pins in each row
 */
export const pinCountPerRow = (pinCount) => {
  const rowCount = rowCountForPins(pinCount);

  if (rowCount <= 1) return [pinCount];

  const pinsInFullRows = Math.ceil(pinCount / rowCount);
  const numberOfFullRows = rowCount - 1;
  const pinsInLastRow = pinCount - (numberOfFullRows * pinsInFullRows);

  return R.append(
    pinsInLastRow,
    R.repeat(pinsInFullRows, numberOfFullRows)
  );
};

/**
 * @param {number} pinCount. Should be less than MAX_PINS_IN_ROW
 * @returns {number} - how many horizontal slots is required to fit a given number of pins
 */
export const horizontalSlotsForPinsRow = (pinCount) => {
  if (pinCount > MAX_PINS_IN_ROW) {
    throw new Error('Exceeded maximum allowed amount of pins per row');
  }

  if (pinCount <= 3) return 1;
  if (pinCount <= 5) return 2;
  if (pinCount <= 8) return 3;
  if (pinCount <= 12) return 4;
  if (pinCount <= 15) return 5;
  return 6;
};

/**
 * @param {number} rowCount - both input and output pin rows
 * @returns {number} - vertical slots needed for a given amount of pin rows
 */
export const verticalSlotsForPinRows = rowCount =>
  // TODO: we need design for extreme cases with a lot of pin rows. See #236
  (rowCount > 2 ? 2 : 1);

/**
 * @param {number} inputPinCount
 * @param {number} outputPinCount
 * @returns {{width: number, height: number}} - horizontal and vertical slots needed for node
 */
export const nodeSizeInSlots = (inputPinCount, outputPinCount) =>
  R.compose(
    R.applySpec({
      width: R.compose(horizontalSlotsForPinsRow, R.apply(Math.max)),
      height: R.compose(verticalSlotsForPinRows, R.length),
    }),
    R.chain(pinCountPerRow) // all pin rows together
  )([inputPinCount, outputPinCount]);


export const slotsWidthInPixels =
  slots => (slots * SLOT_SIZE.WIDTH) + (R.dec(slots) * SLOT_MARGIN.HORIZONTAL);

export const slotsHeightInPixels =
  slots => (slots * SLOT_SIZE.HEIGHT) + (R.dec(slots) * SLOT_MARGIN.VERTICAL);

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
  (nodeWidth, relativePosition) => {
    const {
      rowIndex,
      indexInRow,
      totalPinsInRow,
    } = relativePosition;
    /*
                                [2]
                 |               |               |
     |       +---+---+       +---+---+       +---+---+       |
     |  [0]  |   o   |       |   o   |       |   o   |       |
     +<----->+       +<----->+       +<----->+       +<----->+
     |       | pin 0 |       | pin 1 |       | pin 2 |       |
     |       +-------+       +-------+       +-------+       |
                [1]

      0 - margins between pins
      1 - pin width
      2 - pin center (x)
     */
    const margin = (nodeWidth - (PIN_SIZE.WIDTH * totalPinsInRow)) / R.inc(totalPinsInRow);
    const x = (margin * R.inc(indexInRow)) + (PIN_SIZE.WIDTH * indexInRow) + (PIN_SIZE.WIDTH / 2);
    const y = rowIndex * (PIN_SIZE.HEIGHT + PIN_MARGIN.VERTICAL);

    return { x, y };
  });

/**
 * @param outputRows
 * @returns {number}
 */
const getOutputPinsSectionHeight = R.ifElse(
  R.compose(R.equals(0), R.head), // we have no output rows
  R.always(0),
  R.compose(R.multiply(PIN_SIZE.HEIGHT + PIN_MARGIN.VERTICAL), R.length)
);

/**
 * adds `size` and `outputPinsSectionHeight` to node and `position` to node's pins
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

  const pinRows = R.map(
    pinCountPerRow,
    pinCountByDirection
  );

  const outputPinsSectionHeight = getOutputPinsSectionHeight(pinRows.output);

  const pins = R.map(
    (pin) => {
      const relPxPosition = relativePinPositionToPixels(
        size.width,
        relativePinPosition(pinRows[pin.direction], pin.order)
      );

      // output pin positions start from the bottom
      const position = R.when(
        R.always(R.equals(pin.direction, 'output')),
        R.assoc('y', size.height - relPxPosition.y)
      )(relPxPosition);

      return R.merge(pin, { position });
    },
    node.pins
  );

  return R.merge(node, { size, pins, outputPinsSectionHeight });
};


export const addNodesPositioning = R.map(addNodePositioning);

export const addPoints = R.curry((a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
}));

export const substractPoints = R.curry((a, b) => ({
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

export const getSlotRow = y => Math.floor(y / (SLOT_SIZE.HEIGHT + SLOT_MARGIN.VERTICAL));
export const getSlotColumn = x => Math.floor(x / (SLOT_SIZE.WIDTH + SLOT_MARGIN.HORIZONTAL));

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
  /*
   SLOT_MARGIN.HORIZONTAL / 2
   <---->
   +----------------------------+ ^ ^
   |                            | | |SLOT_MARGIN.VERTICAL / 2
   |    /------------------\    | | v
   |    |                  |    | |
   |    |                  |    | |
   |    |                  |    | |
   |    |                  |    | |SLOT_SIZE.HEIGHT + SLOT_MARGIN.VERTICAL
   |    |                  |    | |
   |    |                  |    | |
   |    \------------------/    | |
   |                            | |
   +----------------------------+ v
   <---------------------------->
   SLOT_SIZE.WIDTH + SLOT_MARGIN.HORIZONTAL
   */
  x: (x * (SLOT_SIZE.WIDTH + SLOT_MARGIN.HORIZONTAL)) + (SLOT_MARGIN.HORIZONTAL / 2),
  y: (y * (SLOT_SIZE.HEIGHT + SLOT_MARGIN.VERTICAL)) + (SLOT_MARGIN.VERTICAL / 2),
});

/**
 * @param node position
 * @return node position snapped to slots grid
 */
export const snapNodePositionToSlots = R.compose(
  slotPositionToPixels,
  getSlotPosition,
  addPoints({ x: SLOT_SIZE.WIDTH / 2, y: SLOT_SIZE.HEIGHT / 2 })
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
