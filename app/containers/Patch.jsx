import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import SVGLayer from '../components/SVGlayer';
import Node from '../components/Node';
import Link from '../components/Link';
import * as Actions from '../actions';

const backgroundStyle = {
  fill: '#eee',
};
const preventSelectStyle = {
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  UserSelect: 'none',
};

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.layers = [{
      name: 'background',
      factory: () => this.createBackground(),
    }, {
      name: 'links',
      factory: () => this.createLinks(
        props.project.links,
        this.props.viewState
      ),
    }, {
      name: 'nodes',
      factory: () => this.createNodes(
        this.props.project.nodes,
        props.project.pins,
        this.props.viewState
      ),
    }];
  }

  onNodeDrag(id, position) {
    this.props.dispatch(Actions.dragNode(id, position));
  }

  onNodeMove(id, position) {
    this.props.dispatch(Actions.moveNode(id, position));
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
            onDragMove: this.onNodeDrag.bind(this),
            onDragEnd: this.onNodeMove.bind(this),
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
    const patchName = this.props.project.patches[this.props.editor.currentPatchId].name;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={this.props.size.width}
        height={this.props.size.height}
        style={preventSelectStyle}
      >
        {this.layers.map(layer =>
          <SVGLayer key={layer.name} name={layer.name}>
            {layer.factory()}
          </SVGLayer>
        )}
        <text x="5" y="20">{`Patch: ${patchName}`}</text>
      </svg>
    );
  }
}

Patch.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  size: React.PropTypes.any.isRequired,
  project: React.PropTypes.any.isRequired,
  editor: React.PropTypes.any.isRequired,
  viewState: React.PropTypes.any.isRequired,
};

export default connect(state => state)(Patch);
