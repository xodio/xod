import React from 'react'
import R from 'ramda'
import Styles from '../styles.js'
import Bbox from '../utils/bbox.js'
import SVGLayer from '../components/SVGlayer.jsx'
import Node from '../components/Node.jsx'

export default class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.viewState = this.createViewState(props);
    this.layers = [ {
      name: 'background'
    }, {
      name: 'nodes',
      childs: this.createNodes(props.nodes, props.pins, this.viewState)
    }, {
      name: 'links',
      // childs: props.links
    } ];
  }

  // @TODO: finish this methods and pass them into components
  createViewState(state) {
    let viewState = {};

    viewState.nodes = this.calcNodes( state.nodes );
    viewState.pins = this.calcPins( state.pins, viewState.nodes );

    return viewState;
  }

  calcNodes( nodes ) {
    let result = {};

    for (let i in nodes) {
      let node = nodes[i];

      result[i] = {};
      result[i].id = node.id;
      result[i].bbox = new Bbox({
        x: nodes[i].position.x,
        y: nodes[i].position.y,
        width: Styles.svg.node.width,
        height: Styles.svg.node.height
      });
    }

    return result;
  }

  calcPins( pins, nodes ) {
    let result = {};

    const pinsByNodes = R.groupBy((pin)=>{ return pin.nodeId; }, R.values(pins));

    for (let n in pinsByNodes) {
      let node = nodes[n];
      const pinsByType = R.groupBy((pin)=>{ return pin.type; }, pinsByNodes[n]);

      let vOffset = {
        input: Styles.svg.node.padding.y - Styles.svg.pin.radius,
        output: node.bbox.getSize().height + Styles.svg.node.padding.y - Styles.svg.pin.radius
      };

      for (let type in pinsByType) {
        const count = pinsByType[type].length;
        const maxLength = count * Styles.svg.pin.radius + (count - 1) * Styles.svg.pin.margin;
        let offset = 0;

        for (let i in pinsByType[type]) {
          let pin = pinsByType[type][i];

          result[pin.id] = {
            id: pin.id,
            nodeId: node.id,
            type: type,
            bbox: new Bbox({
              x: node.bbox.getCenter().x - maxLength + offset,
              y: vOffset[type],
              width: Styles.svg.pin.radius,
              height: Styles.svg.pin.radius
            })
          };

          offset += Styles.svg.pin.margin;
        }
      }

    }

    return result;
  }

  createNodes(nodes, pins, viewState) {
    let nodeChilds = [];
    let nodeFactory = React.createFactory(Node)

    for (let n in nodes) {
      const node = nodes[n];
      const nodePins = R.filter( R.propEq('nodeId', node.id), pins );

      let nodeViewState = R.map(
        R.filter(
          (child)=>{ return (child.nodeId) ? (child.nodeId === node.id) : (child.id === node.id); }
        ),
        viewState
      );

      nodeChilds.push( nodeFactory({key: node.id, node: node, pins: nodePins, style: Styles.svg, viewState: viewState}) );
    }

    return nodeChilds;
  }

  createLinks(links) {

  }

  // calculatePinPositions(pins) {
  //   pins = R.values(pins);

  //   let pinsByType = R.groupBy((pin)=>{ return pin.type; }, pins);

  //   let center = {
  //     x: nodeSize.width / 2 + nodeSize.x,
  //     y: nodeSize.height / 2 + nodeSize.y
  //   };

  //   const radius = 5;
  //   const vOffset = {
  //     input: nodeSize.y - radius,
  //     output: nodeSize.y + nodeSize.height - radius
  //   };
  //   const xPadding = 15;

  //   for (let type in pinsByType) {
  //     let offset = 0;

  //     let count = pinsByType[type].length;
  //     let maxWidth = (count * radius) + (count - 1) * xPadding;
  //     let beginX = center.x - maxWidth;


  //     for (let i in pinsByType[type]) {
  //       pinsByType[type][i].radius = radius;
  //       pinsByType[type][i].position = {
  //         x: beginX + offset,
  //         y: vOffset[type]
  //       };
  //       offset += xPadding;
  //     }
  //   }

  //   return R.flatten(R.values(pinsByType));
  // }

  render() {
    return (
      <svg width={this.props.size.width} height={this.props.size.height} xmlns="http://www.w3.org/2000/svg">
        {this.layers.map(layer =>
          <SVGLayer key={layer.name} name={layer.name} childs={layer.childs} />
        )}
      </svg>
    );
  }
}