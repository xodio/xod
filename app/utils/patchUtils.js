import R from 'ramda';
import Selectors from '../selectors';
import * as PIN_TYPE from '../constants/pinType';
import * as SIZES from '../constants/sizes';

const getMaxSidePinCount = (pins) => R.pipe(
  R.values,
  R.groupBy((pin) => pin.type),
  R.values,
  R.reduce((p, c) => R.max(p, c.length || 0), 0)
)(pins);
const getPinsWidth = (count, withMargins) => {
  const marginCount = (withMargins) ? count + 1 : count - 1;
  return (marginCount * SIZES.PIN.margin) + (count * SIZES.PIN.radius * 2);
};
const getSidesPinCount = (pins) => R.pipe(
  R.values,
  R.groupBy((pin) => pin.type),
  R.values,
  R.reduce((p, group) => {
    const n = p;
    const type = group[0].type;
    n[type] = group.length;
    return n;
  }, {
    [PIN_TYPE.INPUT]: 0,
    [PIN_TYPE.OUTPUT]: 0,
  })
)(pins);
const getPinListWidths = (counts) => ({
  [PIN_TYPE.INPUT]: getPinsWidth(counts[PIN_TYPE.INPUT], false),
  [PIN_TYPE.OUTPUT]: getPinsWidth(counts[PIN_TYPE.OUTPUT], false),
});
const getNodeWidth = (pins) => {
  const pinsCount = getMaxSidePinCount(pins);
  let nodeWidth = getPinsWidth(pinsCount, true);
  if (nodeWidth < SIZES.NODE.min_width) {
    nodeWidth = SIZES.NODE.min_width;
  }
  return nodeWidth;
};
const getPinPosition = (pins, nodeWidth) => {
  const pinsCount = getSidesPinCount(pins);
  const pinsWidth = getPinListWidths(pinsCount);

  return R.pipe(
    R.values,
    R.groupBy((pin) => pin.type),
    R.map((group) => {
      const vOffset = {
        [PIN_TYPE.INPUT]: SIZES.NODE.padding.y - SIZES.PIN.radius,
        [PIN_TYPE.OUTPUT]: SIZES.NODE.min_height + SIZES.NODE.padding.y - SIZES.PIN.radius,
      };
      let offset = 0;

      return R.map((pin) => {
        const r = {
          id: pin.id,
          label: pin.label,
          nodeId: pin.nodeId,
          type: pin.type,
          position: {
            x: (nodeWidth - pinsWidth[pin.type]) / 2 + offset,
            y: vOffset[pin.type],
          },
          radius: SIZES.PIN.radius,
        };

        offset += SIZES.PIN.margin + SIZES.PIN.radius * 2;

        return r;
      }, group);
    }),
    R.values,
    R.flatten,
    R.reduce((p, pin) => {
      const n = p;
      n[pin.id] = pin;
      return n;
    }, {})
  )(pins);
};

const getPinsData = (pinsState, nodeId, nodeWidth, nodeType) => {
  let pins = Selectors.Pin.getPinsByNodeId({
    pins: pinsState,
  }, { id: nodeId });

  if (R.keys(pins).length === 0) {
    let pinsCount = 0;
    pins = R.pipe(
      R.values,
      R.reduce((p, pin) => {
        const n = p;
        n[pin.key] = pin;
        n[pin.key].id = pinsCount;
        pinsCount++;
        return p;
      }, {})
    )(nodeType.pins);
  }

  const pinsExtended = R.map((pin) => {
    const ntPin = nodeType.pins[pin.key];
    return R.merge({
      type: ntPin.type,
      label: ntPin.label,
    })(pin);
  })(pins);

  return getPinPosition(pinsExtended, nodeWidth);
};

export default {
  getNodeWidth,
  getPinsWidth,
  getPinListWidths,
  getPinPosition,
  getPinsData,
  getSidesPinCount,
  getMaxSidePinCount,
};
