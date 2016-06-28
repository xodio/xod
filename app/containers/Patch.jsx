import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import SVGLayer from '../components/SVGlayer';
import Node from '../components/Node';
import Link from '../components/Link';
import * as Actions from '../actions';
import * as ViewState from '../utils/viewstate';

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

    this.createLayers();
  }

  onNodeDragMove(id, position) {
    this.props.dispatch(Actions.dragNode(id, position));
  }
  onNodeDragEnd(id, position) {
    this.props.dispatch(Actions.moveNode(id, position));
  }
  onPinClick(id) {
    this.props.dispatch(Actions.clickPin(id));
  }

  createLayers() {
    this.layers = [{
      name: 'background',
      factory: () => this.createBackground(),
    }, {
      name: 'links',
      factory: () => this.createLinks(this.props.project.links),
    }, {
      name: 'nodes',
      factory: () => this.createNodes(this.props.project.nodes),
    }];
  }
  createNodes(nodes) {
    const nodeFactory = React.createFactory(Node);

    return R.pipe(
      R.values,
      R.reduce((p, node) => {
        const n = p;
        const viewstate = ViewState.getNodeState()(
          this.props.project,
          {
            id: node.id,
          }
        );

        viewstate.key = node.id;
        viewstate.onDragMove = this.onNodeDragMove.bind(this);
        viewstate.onDragEnd = this.onNodeDragEnd.bind(this);
        viewstate.onPinClick = this.onPinClick.bind(this);
        viewstate.draggable = this.isEditMode();

        n.push(
          nodeFactory(viewstate)
        );

        return n;
      }, [])
    )(nodes);
  }

  createLinks(links) {
    const linkFactory = React.createFactory(Link);

    return R.pipe(
      R.values,
      R.reduce((p, link) => {
        const n = p;
        const viewstate = ViewState.getLinkState()(
          this.props.project,
          {
            id: link.id,
            pins: [link.fromPinId, link.toPinId],
          }
        );
        viewstate.key = link.id;

        n.push(linkFactory(viewstate));

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

  isEditMode() {
    return (this.props.editor.mode === 'edit');
  }

  isViewMode() {
    return (this.props.editor.mode === 'view');
  }

  render() {
    this.createLayers();

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
};

export default connect(state => state)(Patch);
