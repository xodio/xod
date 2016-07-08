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
      ghostNode: null,
      ghostLink: null,
    };
    this.nodesViewstate = {};
    this.nodesCount = 0;
    this.nodesRendered = 0;
    this.nodesUpdated = 0;

    this.mousePosition = {
      x: 0,
      y: 0,
    };

    this.createLayers();

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.deselectAll = this.deselectAll.bind(this);
  }

  componentWillUpdate(nextProps) {
    this.nodesCount = 0;

    this.createGhostNode(nextProps);
  }
  componentDidUpdate() {
    this.createGhostLink(this.props);
  }

  onNodeRendered(id, props) {
    if (id === 0) return;

    if (!this.nodesViewstate.hasOwnProperty(id)) {
      this.nodesViewstate[id] = {};
    }

    this.nodesViewstate[id] = R.merge(this.nodesViewstate[id], props);
    if (this.nodesRendered < this.nodesCount) {
      this.nodesRendered++;
    }

    if (this.nodesCount === this.nodesRendered && this.nodesCount !== this.nodesUpdated) {
      this.forceUpdate();
      this.nodesUpdated = this.nodesCount;
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

    this.setClickNodeId(id);
  }
  onPinMouseUp(id) {
    this.props.dispatch(Actions.linkPin(id));
  }
  onLinkClick(id) {
    this.props.dispatch(Actions.selectLink(id));
  }

  onMouseMove(event) {
    const svg = findParentByClassName(event.target, 'patch');
    const bbox = svg.getBoundingClientRect();

    const mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
    const relMousePosition = {
      x: mousePosition.x - bbox.left,
      y: mousePosition.y - bbox.top,
    };

    this.mousePosition = relMousePosition;

    this.dragNode(mousePosition);
    this.dragGhostNode();
    this.dragGhostLink();
  }
  onMouseUp(event) {
    if (this.state.dragNodeId) {
      const dragId = this.state.dragNodeId;
      const draggedPos = this.props.project.nodes[dragId].position;

      this.setDragNodeId(null);
      this.props.dispatch(Actions.moveNode(dragId, draggedPos));
    }
    if (this.state.clickNodeId) {
      this.setClickNodeId(null);
    }
    if (Selectors.Editor.isCreatingMode(this.props.editor)) {
      this.onCreateNode(event);
    }

    this.dragging = {};
  }

  onKeyDown(event) {
    const keycode = event.keyCode || event.which;
    const selection = Selectors.Editor.getSelection(this.props.editor);
    const hasSelection = selection.length > 0;
    const isLinking = this.props.linkingPin !== null;
    if (
      hasSelection &&
      (keycode === KEYCODE.BACKSPACE || keycode === KEYCODE.DELETE)
    ) {
      selection.forEach((select) => {
        this.props.dispatch(Actions[DELETE_ACTIONS[select.entity]](select.id));
      });
    }
    if (
      (hasSelection || isLinking) &&
      keycode === KEYCODE.ESCAPE
    ) {
      this.deselectAll();
    }
  }

  onCreateNode(event) {
    const container = findParentByClassName(event.target, 'patch');
    const targetOffset = container.getBoundingClientRect();
    const position = {
      x: event.clientX - targetOffset.left,
      y: event.clientY - targetOffset.top,
    };
    const nodeTypeId = this.props.editor.selectedNodeType;
    this.props.dispatch(Actions.addNodeWithDependencies(nodeTypeId, position));
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

  dragNode(mousePosition) {
    if (this.state.clickNodeId !== null || this.state.dragNodeId !== null) {
      const dragId = this.state.clickNodeId || this.state.dragNodeId;
      const draggedPos = this.props.project.nodes[dragId].position;
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

      this.setState(
          R.merge(
            this.state,
            {
              dragNodeId: dragId,
              clickNodeId: null,
            }
          )
        );
    }
  }
  dragGhostNode() {
    if (this.props.editor.mode === EDITOR_MODE.CREATING && this.state.ghostNode) {
      this.setState(
        R.set(
          R.lensPath(['ghostNode', 'position']),
          this.mousePosition,
          this.state
        )
      );
    }
  }
  dragGhostLink() {
    if (this.props.linkingPin && this.state.ghostLink) {
      this.setState(
        R.set(
          R.lensPath(['ghostLink', 'to']),
          this.mousePosition,
          this.state
        )
      );
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
  createPinsState(nodeId, nodeWidth) {
    let nodePins = R.pipe(
      R.values,
      R.filter((pin) => (pin.nodeId === nodeId)),
      R.reduce((p, cur) => R.assoc(cur.id, cur, p), {})
    )(this.props.pins);

    if (this.props.linkingPin) {
      const pinValidity = Selectors.Pin.getValidPins(
        this.props.pins,
        this.props.project.links,
        this.props.linkingPin
      );

      nodePins = R.pipe(
        R.values,
        R.filter((pin) => (pin.nodeId === nodeId)),
        R.map((pin) => R.assoc('validness', pinValidity[pin.id].validness, pin)),
        R.reduce((p, cur) => R.assoc(cur.id, cur, p), {})
      )(nodePins);
    }

    return PatchUtils.getPinPosition(nodePins, nodeWidth);
  }
  createNodeState(node, customProps) {
    const props = (typeof customProps === 'object') ? customProps : {};

    const linkingPin = this.props.linkingPin;

    const nodeType = Selectors.NodeType.getNodeTypeById({
      nodeTypes: this.props.nodeTypes,
    }, node.typeId);

    const nodeWidth = (this.nodesViewstate[node.id] && this.nodesViewstate[node.id].width) ?
      this.nodesViewstate[node.id].width :
      PatchUtils.getNodeWidth(nodeType.pins);

    const nodePins = this.createPinsState(node.id, nodeWidth, nodeType);

    const viewstate = {
      id: node.id,
      key: node.id,
      label: node.label || nodeType.label,
      pins: nodePins,
      position: node.position,
      width: nodeWidth,
      onRender: this.onNodeRendered.bind(this),
    };

    if (linkingPin && viewstate.pins && viewstate.pins[linkingPin]) {
      viewstate.pins[linkingPin].selected = true;
    }

    return R.merge(viewstate, props);
  }
  createNodeStates(nodes) {
    let comparator = R.comparator();

    if (this.state.dragNodeId) {
      comparator = (a) => ((a.id === this.state.dragNodeId) ? 1 : 0);
    }

    return R.pipe(
      R.values,
      R.sort(comparator),
      R.reduce((p, node) => {
        const viewstate = this.createNodeState(node, {
          onMouseUp: this.onNodeMouseUp.bind(this),
          onMouseDown: this.onNodeMouseDown.bind(this),
          onPinMouseUp: this.onPinMouseUp.bind(this),
          draggable: Selectors.Editor.isEditingMode(this.props.editor),
          isDragged: (this.state.dragNodeId === node.id),
          isClicked: (this.state.clickNodeId === node.id),
          selected: Selectors.Editor.checkSelection(this.props.editor, 'Node', node.id),
        });

        return R.assoc(node.id, viewstate, p);
      }, {})
    )(nodes);
  }
  createNode(nodeState) {
    const nodeFactory = React.createFactory(Node);
    return nodeFactory(nodeState);
  }
  createNodes(nodes) {
    const viewstate = this.createNodeStates(nodes);

    this.nodesCount = R.keys(nodes).length;

    return R.pipe(
      R.values,
      R.reduce((p, cur) => R.append(
        this.createNode(cur),
        p
      ), [])
    )(viewstate);
  }

  createGhostNode(props) {
    if (props.editor.mode === EDITOR_MODE.CREATING) {
      if (this.state.ghostNode === null) {
        const ghostProps = {
          hoverable: false,
          isDragged: true,
        };
        this.state.ghostNode = this.createNodeState({
          id: 0,
          typeId: this.props.editor.selectedNodeType,
          patchId: this.props.editor.currentPatchId,
          position: this.mousePosition,
        }, ghostProps);
      }
    } else {
      this.state.ghostNode = null;
    }
  }

  createLink(link) {
    const linkFactory = React.createFactory(Link);
    return linkFactory(link);
  }
  createLinkState(link, customProps) {
    const props = (typeof customProps === 'object') ? customProps : {};
    let fromPos = { x: 0, y: 0 };
    let toPos = { x: 0, y: 0 };

    if (link.fromPinId) {
      const fromNodeId = this.props.pins[link.fromPinId].nodeId;
      const fromPin = this.nodesViewstate[fromNodeId].pins[link.fromPinId];

      fromPos = fromPin.realPosition;
    }
    if (link.toPinId) {
      const toNodeId = this.props.pins[link.toPinId].nodeId;
      const toPin = this.nodesViewstate[toNodeId].pins[link.toPinId];

      toPos = toPin.realPosition;
    }

    const viewstate = {
      id: link.id,
      key: link.id,
      from: fromPos,
      to: toPos,
      onClick: this.onLinkClick.bind(this),
      selected: Selectors.Editor.checkSelection(this.props.editor, 'Link', link.id),
    };

    return R.merge(
      viewstate,
      props
    );
  }
  createLinks(links) {
    return R.pipe(
      R.values,
      R.reduce((p, link) => {
        let result = p;
        const fromNodeId = this.props.pins[link.fromPinId].nodeId;
        const toNodeId = this.props.pins[link.toPinId].nodeId;
        const viewstateIsReady = (this.nodesViewstate[fromNodeId] && this.nodesViewstate[toNodeId]);

        if (viewstateIsReady) {
          const viewstate = this.createLinkState(link);
          result = R.append(
            this.createLink(viewstate),
            p
          );
        }
        return result;
      }, [])
    )(links);
  }

  createGhostLink(props) {
    const stateName = 'ghostLink';
    if (props.editor.linkingPin && this.state.ghostLink === null) {
      const linkViewstate = this.createLinkState({
        id: 0,
        fromPinId: this.props.linkingPin,
        toPinId: null,
      }, {
        to: this.mousePosition,
        hoverable: false,
        clickable: false,
      });

      this.setState(
        R.assoc(
          stateName,
          linkViewstate,
          this.state
        )
      );
    } else if (props.editor.linkingPin === null && this.state.ghostLink) {
      this.setState(
        R.assoc(stateName, null, this.state)
      );
    }
  }

  createBackground() {
    const bgChildren = [];
    let bgOnClick = f => f;

    if (Selectors.Editor.isEditingMode(this.props.editor)) {
      bgOnClick = this.deselectAll.bind(this);
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
    const ghostNode = (this.state.ghostNode) ? this.createNode(this.state.ghostNode) : null;
    const ghostLink = (this.state.ghostLink) ? this.createLink(this.state.ghostLink) : null;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="patch"
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
            {(layer.name === LAYERNAME_LINKS) ? ghostLink : null}
            {(layer.name === LAYERNAME_NODES) ? ghostNode : null}
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
  pins: React.PropTypes.any.isRequired,
  project: React.PropTypes.any.isRequired,
  editor: React.PropTypes.any.isRequired,
  nodeTypes: React.PropTypes.any.isRequired,
  linkingPin: React.PropTypes.number,
};

export default connect(state => ({
  pins: Selectors.Pin.getFullPinsData({
    pins: state.project.pins,
    nodes: state.project.nodes,
    nodeTypes: state.nodeTypes,
    editor: state.editor,
  }),
  linkingPin: Selectors.Editor.getLinkingPin(state.editor),
  project: state.project,
  editor: state.editor,
  nodeTypes: state.nodeTypes,
}))(Patch);
