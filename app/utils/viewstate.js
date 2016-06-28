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

// Accepts state.editor as state
export const getSelection = (state) => R.pick(
  [
    'selectedNode',
    'selectedPin',
    'selectedLink',
  ],
  state
);

// Accepts state.project as state
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
const getPinsByIds = (state, props) => R.pipe(
  getPins,
  R.values,
  R.reduce((p, pin) => {
    const n = p;
    if (props && props.pins && props.pins.indexOf(pin.id) !== -1) {
      n[pin.id] = pin;
    }
    return n;
  }, {})
)(state, props);

const getNodesByPinIds = (state, props) => R.pipe(
  getPins,
  R.filter((pin) =>
    props && props.pins && props.pins.indexOf(pin.id) !== -1
  ),
  R.values,
  R.reduce((p, pin) => {
    const n = p;
    n[pin.nodeId] = getNodeById(state, { id: pin.nodeId });
    return n;
  }, {})
)(state, props);

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

const getLinks = (state) => R.pipe(
  R.view(R.lensProp('links'))
)(state);
const getLinkById = (state, props) => R.pipe(
  getLinks,
  R.filter((link) => link.id === props.id),
  R.values,
  R.head
)(state, props);

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
    getNodeById,
    getPinsByNodeId,
  ],
  (node, pins) => getNodeView(node, pins)
);

export const getLinkState = () => createSelector(
  [
    getLinkById,
    getPinsByIds,
    getNodesByPinIds,
    getPins,
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

export const getMeta = (state) => R.pipe(
  R.view(R.lensProp('meta'))
)(state);
