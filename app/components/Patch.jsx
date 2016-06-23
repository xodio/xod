import React from 'react';
import R from 'ramda';
import SVGLayer from '../components/SVGlayer';
import Node from '../components/Node';
import Link from '../components/Link';

const backgroundStyle = {
  fill: '#eee',
};

export default class Patch extends React.Component {
  constructor(props) {
    super(props);

    // console.log('>', this.props);

    this.layers = [{
      name: 'background',
      children: this.createBackground(),
    }, {
      name: 'links',
      children: this.createLinks(props.links, this.props.viewState),
    }, {
      name: 'nodes',
      children: this.createNodes(props.nodes, props.pins, this.props.viewState),
    }];
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
            radius: viewState.sizes.pin.radius,
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
            style: viewState.sizes.link,
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
    const patchName = this.props.patches[this.props.patchId].name;

    return (
      <svg width={this.props.size.width} height={this.props.size.height} xmlns="http://www.w3.org/2000/svg">
        {this.layers.map(layer =>
          <SVGLayer key={layer.name} name={layer.name} children={layer.children} />
        )}
        <text x="5" y="20">{`Patch: ${patchName}`}</text>
      </svg>
    );
  }
}

Patch.propTypes = {
  patchId: React.PropTypes.number.isRequired,
  patches: React.PropTypes.any.isRequired,
  nodes: React.PropTypes.any.isRequired,
  pins: React.PropTypes.any.isRequired,
  links: React.PropTypes.any.isRequired,
  viewState: React.PropTypes.any.isRequired,
  size: React.PropTypes.any.isRequired,
  editorMode: React.PropTypes.string.isRequired,
};
