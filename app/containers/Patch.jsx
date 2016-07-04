import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';

import EventListener from 'react-event-listener';
import SVGLayer from '../components/SVGlayer';
import Node from '../components/Node';
import Link from '../components/Link';

import * as Actions from '../actions';
import Selectors from '../selectors';
import PatchUtils from '../utils/patchUtils';
import * as EDITOR_MODE from '../constants/editorModes';
import * as KEYCODE from '../constants/keycodes';

const LAYERNAME_BACKGROUND = 'background';
const LAYERNAME_LINKS = 'links';
const LAYERNAME_NODES = 'nodes';

const CLICK_SAFEZONE = 3; // How far user should drag a node to prevent selecting by click

// @TODO: Remove in case with replacing with SELECTION_DELETE action
const DELETE_ACTIONS = {
  Node: 'deleteNodeWithDependencies',
  Link: 'deleteLink',
};

const backgroundStyle = {
  fill: '#eee',
};
const svgStyle = {
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  UserSelect: 'none',
  cursor: 'default',
};
const findParentByClassName = (element, className) => {
  let result = null;
  if (element.classList.contains(className)) {
    result = element;
  } else if (element.parentNode) {
    result = findParentByClassName(element.parentNode, className);
  }
  return result;
};

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.dragging = {};
    this.state = {
      clickNodeId: null,
      dragNodeId: null,
    };
    this.nodesViewstate = {};
    this.nodesCount = 0;
    this.nodesRendered = 0;

    this.createLayers();

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.deselectAll = this.deselectAll.bind(this);
  }

  componentDidMount() {
  }

  onNodeRendered(id, props) {
    if (!Object.hasOwnProperty.call(this.nodesViewstate, id)) {
      this.nodesViewstate[id] = {};
    }

    this.nodesViewstate[id] = R.merge(this.nodesViewstate[id], props);
    if (this.nodesRendered < this.nodesCount) {
      this.nodesRendered++;
    }

    if (this.nodesCount === this.nodesRendered) {
      this.forceUpdate();
      this.nodesRendered = Infinity;
    }
  }

  onNodeMouseUp(id) {
    this.props.dispatch(Actions.selectNode(id));
  }
  onNodeMouseDown(event, id) {
    const node = this.props.project.nodes[id].position;

    this.dragging = {
      mousePosition: {
        x: event.clientX,
        y: event.clientY,
      },
      elementPosition: node.position,
    };

    this.setState(
      R.merge(
        this.state,
        {
          clickNodeId: id,
          dragNodeId: id,
        }
      )
    );
  }
  onPinMouseUp(id) {
    this.props.dispatch(Actions.linkPin(id));
  }
  onLinkClick(id) {
    this.props.dispatch(Actions.selectLink(id));
  }

  onMouseMove(event) {
    if (this.state.dragNodeId !== null) {
      const dragId = this.state.dragNodeId;
      const draggedPos = this.props.project.nodes[dragId].position;
      const mousePosition = {
        x: event.clientX,
        y: event.clientY,
      };

      const deltaPosition = {
        x: mousePosition.x - this.dragging.mousePosition.x,
        y: mousePosition.y - this.dragging.mousePosition.y,
      };

      this.dragging = R.set(
        R.lensProp('mousePosition'),
        mousePosition,
        this.dragging
      );
      const newPosition = {
        x: draggedPos.x + deltaPosition.x,
        y: draggedPos.y + deltaPosition.y,
      };

      this.props.dispatch(Actions.dragNode(dragId, newPosition));

      if (
        R.all(
          R.flip(
            R.gte(CLICK_SAFEZONE)
          ),
          newPosition
        )
      ) {
        this.setClickNodeId(null);
      }
    }
  }
  onMouseUp() {
    if (this.state.dragNodeId !== null) {
      const dragId = this.state.dragNodeId;
      const draggedPos = this.props.project.nodes[dragId].position;

      this.setDragNodeId(null);
      this.props.dispatch(Actions.moveNode(dragId, draggedPos));
    }

    this.dragging = {};
  }

  onKeyDown(event) {
    const keycode = event.keyCode || event.which;
    const selection = Selectors.Editor.getSelection(this.props.editor);
    if (selection.length > 0) {
      if (keycode === KEYCODE.BACKSPACE || keycode === KEYCODE.DELETE) {
        selection.forEach((select) => {
          this.props.dispatch(Actions[DELETE_ACTIONS[select.entity]](select.id));
        });
      }
      if (keycode === KEYCODE.ESCAPE) {
        this.deselectAll();
      }
    }
  }

  onCreateNode(event) {
    const targetOffset = event.target.ownerSVGElement.getBoundingClientRect();
    const position = {
      x: event.clientX - targetOffset.left,
      y: event.clientY - targetOffset.top,
    };
    this.props.dispatch(Actions.addNodeWithDependencies(1, position));
    this.props.dispatch(Actions.setMode(EDITOR_MODE.DEFAULT));
  }

  setDragNodeId(id) {
    this.setState(
      R.set(
          R.lensProp('dragNodeId'),
          id,
          this.state
        )
    );
  }
  setClickNodeId(id) {
    const st = R.set(
      R.lensProp('clickNodeId'),
      id,
      this.state
    );
    this.setState(st);
  }

  deselectAll() {
    this.props.dispatch(Actions.deselectAll());
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

    this.nodesCount = R.keys(nodes).length;

    let comparator = R.comparator();

    if (this.state.dragNodeId) {
      comparator = (a) => ((a.id === this.state.dragNodeId) ? 1 : 0);
    }

    return R.pipe(
      R.values,
      R.sort(comparator),
      R.reduce((p, node) => {
        const n = p;
        const linkingPin = this.props.editor.linkingPin;

        const nodeType = Selectors.NodeType.getNodeTypeById({
          nodeTypes: this.props.nodeTypes,
        }, node.typeId);

        const nodeWidth = (this.nodesViewstate[node.id] && this.nodesViewstate[node.id].width) ?
          this.nodesViewstate[node.id].width :
          PatchUtils.getNodeWidth(nodeType.pins);

        const nodePins = PatchUtils.getPinsData(
          this.props.project.pins,
          node.id,
          nodeWidth,
          nodeType
        );

        const viewstate = {
          id: node.id,
          key: node.id,
          label: node.label || nodeType.label,
          pins: nodePins,
          position: node.position,
          width: nodeWidth,
          onRender: this.onNodeRendered.bind(this),
          onMouseUp: this.onNodeMouseUp.bind(this),
          onMouseDown: this.onNodeMouseDown.bind(this),
          onPinMouseUp: this.onPinMouseUp.bind(this),
          draggable: Selectors.Editor.isEditingMode(this.props.editor),
          isDragged: (this.state.dragNodeId === node.id),
          isClicked: (this.state.clickNodeId === node.id),
          selected: Selectors.Editor.checkSelection(this.props.editor, 'Node', node.id),
        };

        if (linkingPin && viewstate.pins && viewstate.pins[linkingPin]) {
          viewstate.pins[linkingPin].selected = true;
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
        const fromNodeId = this.props.project.pins[link.fromPinId].nodeId;
        const toNodeId = this.props.project.pins[link.toPinId].nodeId;

        if (
          this.nodesViewstate[fromNodeId] && this.nodesViewstate[toNodeId]
        ) {
          const fromPin = this.nodesViewstate[fromNodeId].pins[link.fromPinId];
          const toPin = this.nodesViewstate[toNodeId].pins[link.toPinId];

          const viewstate = {
            id: link.id,
            key: link.id,
            from: fromPin.realPosition,
            to: toPin.realPosition,
            onClick: this.onLinkClick.bind(this),
            selected: Selectors.Editor.checkSelection(this.props.editor, 'Link', link.id),
          };

          n.push(linkFactory(viewstate));
        }
        return n;
      }, [])
    )(links);
  }

  createBackground() {
    const bgChildren = [];
    let bgOnClick = f => f;

    if (Selectors.Editor.isEditingMode(this.props.editor)) {
      bgOnClick = this.deselectAll.bind(this);
    } else if (Selectors.Editor.isCreatingMode(this.props.editor)) {
      bgOnClick = this.onCreateNode.bind(this);
    }

    bgChildren.push(
      <rect
        key="bg" x="0" y="0"
        width={this.props.size.width}
        height={this.props.size.height}
        style={backgroundStyle}
        onClick={bgOnClick}
      />
    );

    return bgChildren;
  }

  render() {
    this.createLayers();

    const patchName = this.props.project.patches[this.props.editor.currentPatchId].name;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${this.props.size.width} ${this.props.size.height}`}
        width={this.props.size.width}
        height={this.props.size.height}
        style={svgStyle}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
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
  nodeTypes: React.PropTypes.any.isRequired,
};

export default connect(state => state)(Patch);
