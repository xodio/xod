import R from 'ramda';
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

export default class viewStateGenerator {
  create(state) {
    const viewState = {};

    viewState.nodes = this.getNodesViewState(state);
    viewState.pins = this.getPinsViewState(state, viewState);
    viewState.links = this.getLinksViewState(state, viewState);

    return viewState;
  }

  getMaxSidePinCount(state, nodeId) {
    return R.pipe(
      R.values,
      R.filter((a) => (a.nodeId === nodeId)),
      R.groupBy((a) => a.nodeId + a.type),
      R.values,
      R.reduce((p, c) => R.max(p, c.length || 0), 0)
    )(state.pins);
  }
  getPinsWidth(count, withMargins) {
    const marginCount = (withMargins) ? count + 1 : count - 1;
    return (marginCount * Sizes.pin.margin) + (count * Sizes.pin.radius * 2);
  }
  getNodeWidth(state, nodeId) {
    const pinsMaxCount = this.getMaxSidePinCount(state, nodeId);
    let nodeWidth = this.getPinsWidth(pinsMaxCount, true);

    if (nodeWidth < Sizes.node.min_width) {
      nodeWidth = Sizes.node.min_width;
    }

    return nodeWidth;
  }
  getPinListWidth(state, nodeId) {
    const pinsMaxCount = this.getMaxSidePinCount(state, nodeId);
    return this.getPinsWidth(pinsMaxCount, false);
  }

  getNodesViewState(state) {
    return R.pipe(
      R.values,
      R.reduce((p, node) => {
        const n = p;
        const nodeWidth = this.getNodeWidth(state, node.id);

        n[node.id] = {
          id: node.id,
          bbox: new Bbox({
            x: node.position.x,
            y: node.position.y,
            width: nodeWidth,
            height: Sizes.node.height,
          }),
          padding: Sizes.node.padding,
          draggable: (state.editor.mode === 'edit'),
        };

        return n;
      }, {})
    )(state.nodes);
  }

  getPinsViewState(state, view) {
    return R.pipe(
      R.values,
      R.groupBy((p) => p.nodeId + p.type),
      R.map((a) => {
        const node = view.nodes[a[0].nodeId];
        const nodeWidth = this.getNodeWidth(state, node.id);
        const pinsWidth = this.getPinListWidth(state, node.id);
        let offset = 0;
        const vOffset = {
          input: Sizes.node.padding.y - Sizes.pin.radius,
          output: node.bbox.getSize().height + Sizes.node.padding.y - Sizes.pin.radius,
        };

        return R.map((pin) => {
          const r = {
            id: pin.id,
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
        }, a);
      }),
      R.values,
      R.flatten,
      R.reduce((p, pin) => {
        const n = p;
        n[pin.id] = pin;
        return n;
      }, {})
    )(state.pins);
  }

  getLinksViewState(state, view) {
    return R.pipe(
      R.values,
      R.reduce((p, link) => {
        const n = p;
        const pinFrom = view.pins[link.fromPinId];
        const pinTo = view.pins[link.toPinId];
        const nodeFrom = view.nodes[pinFrom.nodeId];
        const nodeTo = view.nodes[pinTo.nodeId];

        n[link.id] = {
          id: link.id,
          from: pinFrom.bbox.addPosition(nodeFrom.bbox),
          to: pinTo.bbox.addPosition(nodeTo.bbox),
        };

        return n;
      }, {})
    )(state.links);
  }
}
