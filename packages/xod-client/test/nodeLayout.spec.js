import R from 'ramda';
import { assert } from 'chai';

import {
  pinCountPerRow,
  nodeSizeInSlots,
  MAX_PINS_IN_ROW,
} from '../src/project/nodeLayout';


describe('pinCountPerRow', () => {
  it('should return an array', () => {
    assert.isArray(pinCountPerRow(1));
  });

  it('should return a single row if a number of pins is <= MAX_PINS_IN_ROW', () => {
    R.range(1, R.inc(MAX_PINS_IN_ROW)).forEach((pinsNumber) => {
      assert.deepEqual(
        pinCountPerRow(pinsNumber),
        [pinsNumber]
      );
    });
  });

  it('should return more than one row if a number of pins is > MAX_PINS_IN_ROW', () => {
    const rows = pinCountPerRow(R.inc(MAX_PINS_IN_ROW));
    assert(rows.length > 1);
  });

  it('should return rows with pin counts that add up to the original number of pins passed', () => {
    [1, 16, 17, 33, 35, 1000].forEach((pinsNumber) => {
      const sumOfPinsInRows = R.sum(pinCountPerRow(pinsNumber));
      assert.equal(
        sumOfPinsInRows,
        pinsNumber
      );
    });
  });

  it('should minimize length of individual rows', () => {
    /*
     For example, if we are fitting 18 pins into 2 rows,
     this is bad:
     +-----------------------------------+
     | o o o o o o o o o o o o o o o o o |
     +-----------------------------------+
     |                 o                 |
     +-----------------------------------+

     this is good:
     +-------------------+
     | o o o o o o o o o |
     +-------------------+
     | o o o o o o o o o |
     +-------------------+
     */
    [
      [18, [9, 9]],
      [19, [10, 9]],
      [33, [17, 16]],
      [35, [12, 12, 11]],
      [36, [12, 12, 12]],
    ].forEach(
      ([pinsNumber, expectedRows]) =>
        assert.deepEqual(
          pinCountPerRow(pinsNumber),
          expectedRows
        )
    );
  });
});


describe('nodeSizeInSlots', () => {
  it('should return an object with props `width` and `height`', () => {
    const actual = nodeSizeInSlots(100, 100);
    assert.isObject(actual);
    assert.isDefined(actual.width);
    assert.isDefined(actual.height);
  });

  it('should fit nodes with up to MAX_PINS_IN_ROW input or output pins in one row', () => {
    const { height } = nodeSizeInSlots(MAX_PINS_IN_ROW, MAX_PINS_IN_ROW);
    assert(height === 1);
  });

  it('should choose number of horizontal slots to fit both input and output pins', () => {
    // example: 18 input pins(2 rows of 9) will fit in 4 slots,
    // but 15 output pins will take one row of 5 slots.
    // that means that the node will occupy 5 horizontal slots
    assert.deepEqual(
      nodeSizeInSlots(18, 15),
      { width: 5, height: 2 }
    );

    assert.deepEqual(
      nodeSizeInSlots(1, MAX_PINS_IN_ROW),
      { width: 6, height: 1 }
    );

    assert.deepEqual(
      nodeSizeInSlots(MAX_PINS_IN_ROW, 1),
      { width: 6, height: 1 }
    );
  });
});
