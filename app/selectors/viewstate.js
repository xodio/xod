import R from 'ramda';
import { createSelector } from 'reselect';
import Bbox from '../utils/bbox';
import * as SelectorNode from './node';
import * as SelectorPin from './pin';
import * as SelectorLink from './link';

const Sizes = {
  node: {
    min_width: 80,
    height: 40,
    padding: {
      x: 2,
      y: 25,
    },
  },
  pin: {
    radius: 5,
    margin: 15,
  },
};

// Accepts state.project as state
const getMaxSidePinCount = (pins) => R.pipe(
  R.values,
  R.groupBy((pin) => pin.type),
  R.values,
  R.reduce((p, c) => R.max(p, c.length || 0), 0)
)(pins);
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
    input: 0,
    output: 0,
  })
)(pins);

const getPinsWidth = (count, withMargins) => {
  const marginCount = (withMargins) ? count + 1 : count - 1;
  return (marginCount * Sizes.pin.margin) + (count * Sizes.pin.radius * 2);
};
const getNodeWidth = (pins) => {
  const pinsCount = getMaxSidePinCount(pins);
  let nodeWidth = getPinsWidth(pinsCount, true);
  if (nodeWidth < Sizes.node.min_width) {
    nodeWidth = Sizes.node.min_width;
  }
  return nodeWidth;
};
const getPinListWidths = (counts) => ({
  input: getPinsWidth(counts.input, false),
  output: getPinsWidth(counts.output, false),
});

const getPinsView = (pins, nodeBbox, nodeWidth, pinsWidth) => R.pipe(
  R.values,
  R.groupBy((pin) => pin.type),
  R.map((group) => {
    const vOffset = {
      input: Sizes.node.padding.y - Sizes.pin.radius,
      output: nodeBbox.getSize().height + Sizes.node.padding.y - Sizes.pin.radius,
    };
    let offset = 0;

    return R.map((pin) => {
      const r = {
        id: pin.id,
        name: pin.name,
        nodeId: pin.nodeId,
        type: pin.type,
        bbox: new Bbox({
          x: (nodeWidth - pinsWidth[pin.type]) / 2 + offset,
          y: vOffset[pin.type],
          width: Sizes.pin.radius * 2,
          height: Sizes.pin.radius * 2,
        }),
      };

      offset += Sizes.pin.margin + Sizes.pin.radius * 2;

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

const getNodeView = (node, pins) => {
  const nodeWidth = getNodeWidth(pins);
  const pinsCount = getSidesPinCount(pins);
  const pinsWidth = getPinListWidths(pinsCount);
  const nodeBbox = new Bbox({
    x: node.position.x,
    y: node.position.y,
    width: nodeWidth,
    height: Sizes.node.height,
  });

  const pinsView = getPinsView(pins, nodeBbox, nodeWidth, pinsWidth);

  return {
    id: node.id,
    pins: pinsView,
    radius: Sizes.pin.radius,
    bbox: nodeBbox,
    padding: Sizes.node.padding,
  };
};

export const getNodeState = () => createSelector(
  [
    SelectorNode.getNodeById,
    SelectorPin.getPinsByNodeId,
  ],
  (node, pins) => getNodeView(node, pins)
);

export const getLinkState = () => createSelector(
  [
    SelectorLink.getLinkById,
    SelectorPin.getPinsByIds,
    SelectorNode.getNodesByPinIds,
    SelectorPin.getPins,
  ],
  (link, pins, nodes, allPins) => {
    const pinFrom = pins[link.fromPinId];
    const pinTo = pins[link.toPinId];

    const pinsFrom = R.pipe(
      R.values,
      R.filter((pin) => pin.nodeId === pinFrom.nodeId)
    )(allPins);
    const pinsTo = R.pipe(
      R.values,
      R.filter((pin) => pin.nodeId === pinTo.nodeId)
    )(allPins);

    const nodeViewFrom = getNodeView(nodes[pinFrom.nodeId], pinsFrom);
    const nodeViewTo = getNodeView(nodes[pinTo.nodeId], pinsTo);
    const pinViewFrom = nodeViewFrom.pins[pinFrom.id];
    const pinViewTo = nodeViewTo.pins[pinTo.id];

    return {
      id: link.id,
      from: pinViewFrom.bbox.translate(nodeViewFrom.bbox).getAbsCenter(),
      to: pinViewTo.bbox.translate(nodeViewTo.bbox).getAbsCenter(),
    };
  }
);
