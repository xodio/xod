import R from 'ramda';
import { createSelector } from 'reselect';
import Bbox from './bbox';

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

const getNodes = (state) => R.pipe(
  R.view(R.lensProp('nodes'))
)(state);

const getNodeById = (state, props) => R.pipe(
  getNodes,
  R.filter((node) => node.id === props.id),
  R.values,
  R.head
)(state, props);

const getPins = (state) => R.pipe(
  R.view(R.lensProp('pins'))
)(state);

const getPinsByNodeId = (state, props) => R.pipe(
  getPins,
  R.filter((pin) => pin.nodeId === props.id)
)(state, props);

const getMaxSidePinCount = (pins) => R.pipe(
  R.values,
  R.groupBy((pin) => pin.type),
  R.values,
  R.reduce((p, c) => R.max(p, c.length || 0), 0)
)(pins);

const getPinsWidth = (count, withMargins) => {
  const marginCount = (withMargins) ? count + 1 : count - 1;
  return (marginCount * Sizes.pin.margin) + (count * Sizes.pin.radius * 2);
};

// const getLinks = (state) => R.pipe(
//   getProject,
//   R.view(R.lensProp('links'))
// )(state);

// const getMeta = (state) => R.pipe(
//   getProject,
//   R.view(R.lensProp('meta'))
// )(state);

const getNodeWidth = (pins) => {
  const pinsCount = getMaxSidePinCount(pins);
  let nodeWidth = getPinsWidth(pinsCount, true);
  if (nodeWidth < Sizes.node.min_width) {
    nodeWidth = Sizes.node.min_width;
  }
  return nodeWidth;
};
const getPinListWidth = (pins) => {
  const pinsCount = getMaxSidePinCount(pins);
  return getPinsWidth(pinsCount, false);
};

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
          x: (nodeWidth - pinsWidth) / 2 + offset,
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

export const getNode = () => createSelector(
  [
    getNodeById,
    getPinsByNodeId,
  ],
  (node, pins) => {
    const nodeWidth = getNodeWidth(pins);
    const pinsWidth = getPinListWidth(pins);
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
  }
);
