import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';

import EventListener from 'react-event-listener';
import PatchWrapper from '../components/PatchWrapper';
import PatchSVG from '../components/PatchSVG';
import Background from '../components/Background';
import Nodes from '../components/Nodes';
import Links from '../components/Links';

import * as Actions from '../actions';
import Selectors from '../selectors';
import { isInput, findParentByClassName } from '../utils/browser';
import * as EDITOR_MODE from '../constants/editorModes';
import * as KEYCODE from '../constants/keycodes';

const PATCH_SVG_CLASS = 'PatchSVG';

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.dragging = {};
    this.state = {
      clickNodeId: null,
      dragNodeId: null,
    };
    this.mousePosition = { x: 0, y: 0 };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onNodeMouseUp = this.onNodeMouseUp.bind(this);
    this.onNodeMouseDown = this.onNodeMouseDown.bind(this);
    this.onPinMouseUp = this.onPinMouseUp.bind(this);
    this.onLinkClick = this.onLinkClick.bind(this);

    this.deselectAll = this.deselectAll.bind(this);
  }

  onNodeMouseUp(id) {
    const isSelected = Selectors.Editor.isSelected(this.props.selection, 'Node', id);
    const isSelectable = (this.props.mode.isEditing);
    const canSelectNode = (isSelectable && !isSelected);
    if (canSelectNode) {
      this.props.dispatch(Actions.selectNode(id));
    }
  }

  onNodeMouseDown(event, id) {
    const isDraggable = (this.props.mode.isEditing || this.props.mode.isLinking);

    if (!isDraggable) { return; }

    const node = this.props.nodes[id].position;
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
    const pin = this.props.pins[id];
    const nodeId = pin.nodeId;
    const isClicked = (this.state.clickNodeId === nodeId);

    if (isClicked) {
      this.props.dispatch(Actions.linkPin(id));
    } else {
      this.onNodeMouseUp(nodeId);
    }
  }

  onLinkClick(id) {
    if (id > 0) {
      this.props.dispatch(Actions.selectLink(id));
    } else {
      this.deselectAll();
    }
  }

  onMouseMove(event) {
    const svg = findParentByClassName(event.target, PATCH_SVG_CLASS);
    const bbox = svg.getBoundingClientRect();

    const mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
    const relMousePosition = {
      x: mousePosition.x - bbox.left,
      y: mousePosition.y - bbox.top,
    };

    const isDraggingGhost = (this.props.mode.isCreatingNode || this.props.mode.isLinking);

    this.setMousePosition(relMousePosition);

    this.dragNode(mousePosition);

    if (isDraggingGhost) {
      this.forceUpdate();
    }
  }

  onMouseUp(event) {
    if (this.state.dragNodeId) {
      const dragId = this.state.dragNodeId;
      const draggedPos = this.props.nodes[dragId].position;

      this.setDragNodeId(null);
      this.props.dispatch(Actions.moveNode(dragId, draggedPos));
    }
    if (this.state.clickNodeId) {
      this.setClickNodeId(null);
    }
    if (this.props.mode.isCreatingNode) {
      this.onCreateNode(event);
    }

    this.dragging = {};
  }

  onKeyDown(event) {
    const keycode = event.keyCode || event.which;
    const selection = this.props.selection;
    const hasSelection = selection.length > 0;
    const isLinking = this.props.linkingPin !== null;
    const isNotInput = !isInput(event);
    if (isNotInput) {
      if (
        hasSelection &&
        (keycode === KEYCODE.BACKSPACE || keycode === KEYCODE.DELETE)
      ) {
        this.props.dispatch(Actions.deleteSelection());
      }
      if (
        (hasSelection || isLinking) &&
        keycode === KEYCODE.ESCAPE
      ) {
        this.deselectAll();
      }
    }
  }

  onCreateNode(event) {
    const container = findParentByClassName(event.target, PATCH_SVG_CLASS);
    const targetOffset = container.getBoundingClientRect();
    const position = {
      x: event.clientX - targetOffset.left,
      y: event.clientY - targetOffset.top,
    };
    const nodeTypeId = this.props.selectedNodeType;
    this.props.dispatch(Actions.addNode(nodeTypeId, position));
    this.props.dispatch(Actions.setMode(EDITOR_MODE.DEFAULT));
    // @TODO: Combine it in one action and add feature of selecting new node by default
  }

  getNodes() {
    let nodes = R.values(this.props.nodes);

    nodes = this.extendNodesByPinValidness(nodes);
    nodes = this.extendNodesByNodeGhost(nodes);

    return nodes;
  }
  getLinks() {
    let links = R.values(this.props.links);

    links = this.extendLinksByLinkGhost(links);

    return links;
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

  setMousePosition(pos) {
    this.mousePosition = pos;
    // this.setState(
    //   R.assoc('mousePosition', pos, this.state)
    // );
  }

  extendNodesByPinValidness(nodes) {
    if (!this.props.linkingPin) {
      return nodes;
    }

    const pinsValidation = Selectors.Project.getValidPins(
      this.props.pins,
      this.props.links,
      this.props.linkingPin
    );

    const assignValidnessToPins = (pins) => R.pipe(
      R.values,
      R.map((pin) => R.assoc('validness', pinsValidation[pin.id].validness, pin)),
      R.reduce((p, cur) => R.assoc(cur.id, cur, p), {})
    )(pins);

    return R.pipe(
      R.values,
      R.map(node => R.assoc('pins', assignValidnessToPins(node.pins), node))
    )(this.props.nodes);
  }

  extendNodesByNodeGhost(nodes) {
    if (!this.props.ghostNode) {
      return nodes;
    }

    const ghostNode = R.merge(
      this.props.ghostNode,
      {
        position: this.mousePosition,
        isGhost: true,
      }
    );

    ghostNode.pins = R.pipe(
      R.values,
      R.map(pin => R.assoc('position', {
        x: pin.position.x + ghostNode.position.x,
        y: pin.position.y + ghostNode.position.y,
      }, pin)),
      R.reduce((p, cur) => R.assoc(cur.id, cur, p), {})
    )(ghostNode.pins);

    return R.append(ghostNode, nodes);
  }

  extendLinksByLinkGhost(links) {
    if (!this.props.ghostLink) {
      return links;
    }

    const ghostLink = R.merge(
      this.props.ghostLink,
      {
        to: this.mousePosition,
      }
    );

    return R.append(ghostLink, links);
  }

  dragNode(mousePosition) {
    if (this.state.clickNodeId !== null || this.state.dragNodeId !== null) {
      const dragId = this.state.clickNodeId || this.state.dragNodeId;
      const draggedPos = this.props.nodes[dragId].position;
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

      if (this.state.dragNodeId !== dragId && this.state.clickNodeId !== null) {
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
  }

  deselectAll() {
    this.props.dispatch(Actions.deselectAll());
  }

  render() {
    const nodes = this.getNodes();
    const links = this.getLinks();

    return (
      <PatchWrapper>
        <EventListener target={document} onKeyDown={this.onKeyDown} />
        <PatchSVG
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
        >
          <Background
            width={this.props.size.width}
            height={this.props.size.height}
            onClick={this.deselectAll}
          />
          <Links
            links={links}
            onClick={this.onLinkClick}
          />
          <Nodes
            nodes={nodes}
            onMouseUp={this.onNodeMouseUp}
            onMouseDown={this.onNodeMouseDown}
            onPinMouseUp={this.onPinMouseUp}
          />
        </PatchSVG>
      </PatchWrapper>
    );
  }
}

Patch.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  size: React.PropTypes.any.isRequired,
  nodes: React.PropTypes.any,
  ghostNode: React.PropTypes.any,
  ghostLink: React.PropTypes.any,
  pins: React.PropTypes.any,
  links: React.PropTypes.any,
  patch: React.PropTypes.any,
  linkingPin: React.PropTypes.number,
  selection: React.PropTypes.array,
  selectedNodeType: React.PropTypes.number,
  nodeTypes: React.PropTypes.object,
  mode: React.PropTypes.object,
};

const mapStateToProps = (state) => ({
  nodes: Selectors.Project.getPreparedNodes(state),
  ghostNode: Selectors.Project.getNodeGhost(state),
  ghostLink: Selectors.Project.getLinkGhost(state),
  links: Selectors.Project.getPreparedLinks(state),
  pins: Selectors.Project.getPreparedPins(state),
  patch: Selectors.Project.getCurrentPatch(state),
  selection: Selectors.Editor.getSelection(state),
  selectedNodeType: Selectors.Editor.getSelectedNodeType(state),
  mode: Selectors.Editor.getModeChecks(state),
  linkingPin: Selectors.Editor.getLinkingPin(state),
  nodeTypes: Selectors.Project.getNodeTypes(state),
});

export default connect(mapStateToProps)(Patch);
