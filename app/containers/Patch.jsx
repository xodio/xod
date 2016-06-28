import React from 'react';
import { connect } from 'react-redux';
import EventListener from 'react-event-listener';
import R from 'ramda';
import SVGLayer from '../components/SVGlayer';
import Node from '../components/Node';
import Link from '../components/Link';
import * as Actions from '../actions';
import Selectors from '../selectors';

const KEYCODE_DELETE = 46;
const KEYCODE_BACKSPACE = 8;
const KEYCODE_ESCAPE = 27;

const LAYERNAME_BACKGROUND = 'background';
const LAYERNAME_LINKS = 'links';
const LAYERNAME_NODES = 'nodes';

const backgroundStyle = {
  fill: '#eee',
};
const svgStyle = {
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  UserSelect: 'none',
  cursor: 'default',
};

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.createLayers();

    this.onKeyDown = this.onKeyDown.bind(this);
  }

  onNodeClick(id) {
    this.props.dispatch(Actions.clickNode(id));
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
  onLinkClick(id) {
    this.props.dispatch(Actions.clickLink(id));
  }

  onKeyDown(event) {
    const keycode = event.keyCode || event.which;
    const selection = Selectors.Editor.getSelection(this.props.editor);
    if (selection.length > 0) {
      if (keycode === KEYCODE_BACKSPACE || keycode === KEYCODE_DELETE) {
        selection.forEach((select) => {
          // Deleting nodes is disabled
          // Until they are not able to delete children pins and connected links
          if (select.entity !== 'Node') {
            const delAction = `delete${select.entity}`;
            this.props.dispatch(Actions[delAction](select.id));
          }
        });
      }
      if (keycode === KEYCODE_ESCAPE) {
        this.props.dispatch(Actions.deselectAll());
      }
    }
  }

  createLayers() {
    this.layers = [{
      name: LAYERNAME_BACKGROUND,
      factory: () => this.createBackground(),
    }, {
      name: LAYERNAME_LINKS,
      factory: () => this.createLinks(
        this.props.project.links
      ),
    }, {
      name: LAYERNAME_NODES,
      factory: () => this.createNodes(
        this.props.project.nodes
      ),
    }];
  }
  createNodes(nodes) {
    const nodeFactory = React.createFactory(Node);

    return R.pipe(
      R.values,
      R.reduce((p, node) => {
        const n = p;
        const selectedPin = this.props.editor.selectedPin;
        const viewstate = Selectors.ViewState.getNodeState()(
          this.props.project,
          {
            id: node.id,
          }
        );

        viewstate.key = node.id;
        viewstate.onClick = this.onNodeClick.bind(this);
        viewstate.onDragMove = this.onNodeDragMove.bind(this);
        viewstate.onDragEnd = this.onNodeDragEnd.bind(this);
        viewstate.onPinClick = this.onPinClick.bind(this);
        viewstate.draggable = this.isEditMode();
        viewstate.isDragged = (this.state.dragNodeId === node.id);

        viewstate.selected = Selectors.Editor.checkSelection(this.props.editor, 'Node', node.id);

        if (selectedPin && viewstate.pins && viewstate.pins[selectedPin]) {
          viewstate.pins[selectedPin].selected = true;
        }

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
        const viewstate = Selectors.ViewState.getLinkState()(
          this.props.project,
          {
            id: link.id,
            pins: [link.fromPinId, link.toPinId],
          }
        );
        viewstate.key = link.id;
        viewstate.onClick = this.onLinkClick.bind(this);
        viewstate.selected = Selectors.Editor.checkSelection(this.props.editor, 'Link', link.id);

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
        style={svgStyle}
      >
        <EventListener target={document} onKeyDown={this.onKeyDown} />
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
