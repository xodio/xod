import React from 'react';
import R from 'ramda';
import Bbox from '../utils/bbox';
import SVGLayer from '../components/SVGlayer';
import Node from '../components/Node';
import Link from '../components/Link';

const backgroundStyle = {
  fill: '#eee',
};

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

export default class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.viewState = this.createViewState(props);
    this.layers = [{
      name: 'background',
      children: this.createBackground(),
    }, {
      name: 'links',
      children: this.createLinks(props.links, this.viewState),
    }, {
      name: 'nodes',
      children: this.createNodes(props.nodes, props.pins, this.viewState),
    }];

    // console.log('patch: ', this.props);
    // console.log('viewState: ', this.viewState);
  }

  getMaxSidePinCount(pins, nodeId) {
    return R.pipe(
      R.values,
      R.filter((a) => (a.nodeId === nodeId)),
      R.groupBy((a) => a.nodeId + a.type),
      R.values,
      R.reduce((p, c) => R.max(p, c.length || 0), 0)
    )(pins);
  }
  getPinsWidth(count, withMargins) {
    const marginCount = (withMargins) ? count + 1 : count - 1;
    return (marginCount * Sizes.pin.margin) + (count * Sizes.pin.radius * 2);
  }
  getNodeWidth(nodeId) {
    const pinsMaxCount = this.getMaxSidePinCount(this.props.pins, nodeId);
    let nodeWidth = this.getPinsWidth(pinsMaxCount, true);

    if (nodeWidth < Sizes.node.min_width) {
      nodeWidth = Sizes.node.min_width;
    }

    return nodeWidth;
  }
  getPinListWidth(nodeId) {
    const pinsMaxCount = this.getMaxSidePinCount(this.props.pins, nodeId);
    return this.getPinsWidth(pinsMaxCount, false);
  }

  createViewState(state) {
    const viewState = {};

    viewState.nodes = this.calcNodes(state.nodes);
    viewState.pins = this.calcPins(state.pins, viewState.nodes);
    viewState.links = this.calcLinks(state.links, viewState.pins, viewState.nodes);

    return viewState;
  }

  calcNodes(nodes) {
    return R.pipe(
      R.values,
      R.reduce((p, node) => {
        const n = p;
        const nodeWidth = this.getNodeWidth(node.id);

        n[node.id] = {
          id: node.id,
          bbox: new Bbox({
            x: node.position.x,
            y: node.position.y,
            width: nodeWidth,
            height: Sizes.node.height,
          }),
          padding: Sizes.node.padding,
        };

        return n;
      }, {})
    )(nodes);
  }

  calcPins(pins, nodesView) {
    return R.pipe(
      R.values,
      R.groupBy((p) => p.nodeId + p.type),
      R.map((a) => {
        const node = nodesView[a[0].nodeId];
        const nodeWidth = this.getNodeWidth(node.id);
        const pinsWidth = this.getPinListWidth(node.id);
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
    )(pins);
  }

  calcLinks(links, pinsView, nodesView) {
    return R.pipe(
      R.values,
      R.reduce((p, link) => {
        const n = p;
        const pinFrom = pinsView[link.fromPinId];
        const pinTo = pinsView[link.toPinId];
        const nodeFrom = nodesView[pinFrom.nodeId];
        const nodeTo = nodesView[pinTo.nodeId];

        n[link.id] = {
          id: link.id,
          from: pinFrom.bbox.addPosition(nodeFrom.bbox),
          to: pinTo.bbox.addPosition(nodeTo.bbox),
        };

        return n;
      }, {})
    )(links);
  }

  createNodes(nodes, pins, viewState) {
    const nodeFactory = React.createFactory(Node);

    return R.pipe(
      R.values,
      R.reduce((p, node) => {
        const nodePins = R.filter(R.propEq('nodeId', node.id), pins);

        const n = p;
        n.push(
          nodeFactory({
            key: node.id,
            node,
            pins: nodePins,
            radius: Sizes.pin.radius,
            viewState,
          })
        );

        return n;
      }, [])
    )(nodes);
  }

  createLinks(links, viewState) {
    const linkFactory = React.createFactory(Link);

    return R.pipe(
      R.values,
      R.reduce((p, link) => {
        const n = p;
        n.push(
          linkFactory({
            key: link.id,
            link,
            viewState: viewState.links[link.id],
            style: Sizes.link,
          })
        );

        return n;
      }, [])
    )(links);
  }

  createBackground() {
    const bgChildren = [];

    bgChildren.push(
      <rect
        key="bg" x="0" y="0"
        width={this.props.size.width} height={this.props.size.height}
        style={backgroundStyle}
      />
    );

    return bgChildren;
  }

  render() {
    return (
      <svg width={this.props.size.width} height={this.props.size.height} xmlns="http://www.w3.org/2000/svg">
        <text x="5" y="5">{this.props.name}</text>
        {this.layers.map(layer =>
          <SVGLayer key={layer.name} name={layer.name} children={layer.children} />
        )}
      </svg>
    );
  }
}

Patch.propTypes = {
  name: React.PropTypes.string,
  links: React.PropTypes.any.isRequired,
  nodes: React.PropTypes.any.isRequired,
  pins: React.PropTypes.any.isRequired,
  size: React.PropTypes.any.isRequired,
};
