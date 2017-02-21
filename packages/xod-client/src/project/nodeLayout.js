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

/**
 * @param {number} pinsCount
 * @returns {number} - how many rows is needed for a given number of pins
 */
export const rowsNumberForPins = pinsCount =>
  Math.ceil(pinsCount / MAX_PINS_IN_ROW);

/**
 * @param {number} pinsCount
 * @returns {number[]} - number of pins in each row
 */
export const pinsCountPerRow = (pinsCount) => {
  const rowsNumber = rowsNumberForPins(pinsCount);

  if (rowsNumber <= 1) return [pinsCount];

  const pinsInFullRows = Math.ceil(pinsCount / rowsNumber);
  const fullRowsCount = rowsNumber - 1;
  const pinsInLastRow = pinsCount - (fullRowsCount * pinsInFullRows);

  return R.append(
    pinsInLastRow,
    R.repeat(pinsInFullRows, fullRowsCount)
  );
};

/**
 * @param {number} pinsCount. Should be less than MAX_PINS_IN_ROW
 * @returns {number} - how many horizontal slots is required to fit a given number of pins
 */
export const horizontalSlotsForPinsRow = (pinsCount) => {
  if (pinsCount > MAX_PINS_IN_ROW) {
    throw new Error('Exceeded maximum allowed amount of pins per row');
  }

  if (pinsCount <= 3) return 1;
  if (pinsCount <= 5) return 2;
  if (pinsCount <= 8) return 3;
  if (pinsCount <= 12) return 4;
  if (pinsCount <= 15) return 5;
  return 6;
};

/**
 * @param {number} rowsCount - both input and output pin rows
 * @returns {number} - vertical slots needed for a given amount of pin rows
 */
export const verticalSlotsForPinRows = rowsCount =>
  // TODO: we need design for extreme cases with a lot of pin rows. See #236
  (rowsCount > 2 ? 2 : 1);

/**
 * @param {number} inputPinsCount
 * @param {number} outputPinsCount
 * @returns {{width: number, height: number}} - horizontal and vertical slots needed for node
 */
export const nodeSizeInSlots = (inputPinsCount, outputPinsCount) => {
  const allPinRows = R.concat(
    pinsCountPerRow(inputPinsCount),
    pinsCountPerRow(outputPinsCount)
  );

  const horizontalSlotsForNode = R.compose(
    horizontalSlotsForPinsRow,
    R.apply(Math.max)
  )(allPinRows);

  const verticalSlotsForNode = verticalSlotsForPinRows(allPinRows.length);

  return {
    width: horizontalSlotsForNode,
    height: verticalSlotsForNode,
  };
};

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

/**
 *
 */
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
  const pinsCountByDirection = R.compose(
    R.map(R.length),
    R.merge({ input: [], output: [] }),
    R.groupBy(R.prop('direction')),
    R.values
  )(node.pins);

  const sizeInSlots = nodeSizeInSlots(
    pinsCountByDirection.input,
    pinsCountByDirection.output
  );

  const size = slotsToPixels(sizeInSlots);

  const pinRows = R.map(
    pinsCountPerRow,
    pinsCountByDirection
  );

  const outputPinsSectionHeight = getOutputPinsSectionHeight(pinRows.output);

  const pins = R.map(
    (pin) => {
      const relPxPosition = relativePinPositionToPixels(
        size.width,
        relativePinPosition(pinRows[pin.direction], pin.index)
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

export const addPoints = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

/**
 * @param nodes — dereferenced nodes with added positioning data
 * @param links - dereferenced links
 */
export const addLinksPositioning = (nodes, links) =>
  R.map((link) => {
    const pins = R.map(
      data => R.merge(
        data,
        nodes[data.nodeId].pins[data.pinKey]
      ),
      link.pins
    );
    return R.merge(
      link,
      {
        from: addPoints(nodes[pins[0].nodeId].position, pins[0].position) || null,
        to: addPoints(nodes[pins[1].nodeId].position, pins[1].position) || null,
      }
    );
  })(links);
