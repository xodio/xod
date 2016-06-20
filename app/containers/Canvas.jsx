import React from 'react';
import R from 'ramda';
import SVGLayer from '../components/SVGlayer.jsx'
import Node from '../components/Node.jsx'

// @TODO: Separate it into container and component (link container with component using connect)
export default class Canvas extends React.Component {
  constructor(props) {
    super(props);

    this.layers = [ {
      name: 'background'
    }, {
      name: 'nodes',
      childs: this.createNodeChilds(props.nodes, props.pins)
    }, {
      name: 'links',
      // childs: props.links
    } ];

  }

  createNodeChilds(nodes, pins) {
    let nodeChilds = [];
    let nodeFactory = React.createFactory(Node)

    for (let n in nodes) {
      const node = nodes[n];
      const nodePins = R.filter( R.propEq('nodeId', node.id), pins );

      nodeChilds.push( nodeFactory({key: node.id, node: node, pins: nodePins}) );
    }

    return nodeChilds;
  }

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