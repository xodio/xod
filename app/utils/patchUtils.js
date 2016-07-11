import R from 'ramda';
import * as PIN_DIRECTION from '../constants/pinDirection';
import * as SIZES from '../constants/sizes';

const getMaxSidePinCount = (pins) => R.pipe(
  R.values,
  R.groupBy((pin) => pin.direction),
  R.values,
  R.reduce((p, c) => R.max(p, c.length || 0), 0)
)(pins);
const getPinsWidth = (count, withMargins) => {
  const marginCount = (withMargins) ? count + 1 : count - 1;
  return (marginCount * SIZES.PIN.margin) + (count * SIZES.PIN.radius * 2);
};
const getSidesPinCount = (pins) => R.pipe(
  R.values,
  R.groupBy((pin) => pin.direction),
  R.values,
  R.reduce((p, group) => {
    const direction = group[0].direction;
    return R.assoc(direction, group.length, p);
  }, {
    [PIN_DIRECTION.INPUT]: 0,
    [PIN_DIRECTION.OUTPUT]: 0,
  })
)(pins);
const getPinListWidths = (counts) => ({
  [PIN_DIRECTION.INPUT]: getPinsWidth(counts[PIN_DIRECTION.INPUT], false),
  [PIN_DIRECTION.OUTPUT]: getPinsWidth(counts[PIN_DIRECTION.OUTPUT], false),
});
const getNodeWidth = (pins) => {
  const pinsCount = getMaxSidePinCount(pins);
  let nodeWidth = getPinsWidth(pinsCount, true);
  if (nodeWidth < SIZES.NODE.minWidth) {
    nodeWidth = SIZES.NODE.minWidth;
  }
  return nodeWidth;
};
const getPinPosition = (pins, nodeWidth) => {
  const pinsCount = getSidesPinCount(pins);
  const pinsWidth = getPinListWidths(pinsCount);
  return R.pipe(
    R.values,
    R.groupBy((pin) => pin.direction),
    R.map((group) => {
      const vOffset = {
        [PIN_DIRECTION.INPUT]: SIZES.NODE.padding.y - SIZES.PIN.radius,
        [PIN_DIRECTION.OUTPUT]: SIZES.NODE.minHeight + SIZES.NODE.padding.y - SIZES.PIN.radius,
      };
      let offset = 0;

      return R.map((pin) => {
        const r = R.merge(
          pin,
          {
            position: {
              x: (nodeWidth - pinsWidth[pin.direction]) / 2 + offset,
              y: vOffset[pin.direction],
            },
            radius: SIZES.PIN.radius,
          }
        );

        offset += SIZES.PIN.margin + SIZES.PIN.radius * 2;

        return r;
      }, group);
    }),
    R.values,
    R.flatten,
    R.reduce((p, pin) => R.assoc(pin.id, pin, p), {})
  )(pins);
};

export default {
  getNodeWidth,
  getPinsWidth,
  getPinListWidths,
  getPinPosition,
  getSidesPinCount,
  getMaxSidePinCount,
};
