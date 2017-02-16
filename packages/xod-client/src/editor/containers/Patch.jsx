import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';
import core from 'xod-core';

import * as EditorActions from '../actions'; // @TODO: remove it!
import * as EditorSelectors from '../selectors';
import * as ProjectActions from '../../project/actions';
import { findRootSVG } from '../../utils/browser';
import { notNil } from '../../utils/ramda';

import { COMMAND } from '../../utils/constants';
import PatchSVG from '../../project/components/PatchSVG';
import BackgroundLayer from '../../project/components/BackgroundLayer';
import NodesLayer from '../../project/components/NodesLayer';
import LinksLayer from '../../project/components/LinksLayer';
import GhostsLayer from '../../project/components/GhostsLayer';

class Patch extends React.Component {
  constructor(props) {
    super(props);

    // contains mousePosition: {x, y} when dragging is in progress, otherwise empty
    this.dragging = {};
    this.state = {
      clickNodeId: null,
      mousePosition: { x: 0, y: 0 },
    };

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.onNodeMouseDown = this.onNodeMouseDown.bind(this);
    this.onNodeSelect = this.onNodeSelect.bind(this);

    this.onPinMouseDown = this.onPinMouseDown.bind(this);
    this.onPinMouseUp = this.onPinMouseUp.bind(this);

    this.onLinkClick = this.onLinkClick.bind(this);

    this.deselectAll = this.deselectAll.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const hasGhosts = R.compose(
      notNil,
      R.either(R.prop('ghostNode'), R.prop('ghostLink'))
    );

    const isChangingMousePosition = nextState.mousePosition !== this.state.mousePosition;

    const shouldNotUpdateMousePosition = (
      !(
        hasGhosts(this.props) ||
        hasGhosts(nextProps) ||
        this.isDragging()
      ) &&
      isChangingMousePosition
    );

    if (shouldNotUpdateMousePosition) { return false; }

    return true;
  }

  /**
   * If a node with a given id can be selected, dispatches `selectNode` action
   * @param id
   */
  onNodeSelect(id) {
    const isSelected = EditorSelectors.isNodeSelected(this.props.selection, id);
    const isSelectable = (this.props.mode.isEditing);
    const canSelectNode = (isSelectable && !isSelected);

    if (canSelectNode) {
      this.props.actions.selectNode(id);
    }
  }

  onNodeMouseDown(event, id) {
    const isDraggable = (this.props.mode.isEditing || this.props.mode.isLinking);

    this.onNodeSelect(id);
    if (!isDraggable) { return; }

    this.dragging = {
      mousePosition: {
        x: event.clientX,
        y: event.clientY,
      },
    };

    this.setClickNodeId(id);
  }

  onPinMouseDown(nodeId, pinKey) {
    this.props.actions.linkPin(nodeId, pinKey);
  }
  onPinMouseUp(nodeId, pinKey) {
    const lp = this.props.linkingPin;
    const firstPinClick = !lp || (
      nodeId === lp.nodeId &&
      pinKey === lp.pinKey
    );

    if (firstPinClick) { return; }

    this.props.actions.linkPin(nodeId, pinKey);
  }

  onLinkClick(id) {
    if (id.length > 0) {
      this.props.actions.selectLink(id);
    } else {
      this.deselectAll();
    }
  }

  onMouseMove(event) {
    const svg = findRootSVG(event.target);
    const bbox = svg.getBoundingClientRect();

    const mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
    const relMousePosition = {
      x: mousePosition.x - bbox.left,
      y: mousePosition.y - bbox.top,
    };

    this.setMousePosition(relMousePosition);
    this.dragNode(mousePosition);
  }

  onMouseUp(event) {
    if (this.state.clickNodeId && this.isDragging()) {
      const draggedNodeId = this.state.clickNodeId;
      const draggedPos = this.props.nodes[draggedNodeId].position;

      this.props.actions.moveNode(draggedNodeId, draggedPos);
    }

    this.setClickNodeId(null);

    if (this.props.mode.isCreatingNode) {
      this.onCreateNode(event);
    }

    this.dragging = {};
  }

  onCreateNode(event) {
    const container = findRootSVG(event.target);
    const targetOffset = container.getBoundingClientRect();
    const position = {
      x: event.clientX - targetOffset.left,
      y: event.clientY - targetOffset.top,
    };
    const nodeTypeId = this.props.selectedNodeType;
    const curPatchId = this.props.patchId;
    this.props.actions.addAndSelectNode(nodeTypeId, position, curPatchId);
  }

  getNodes() {
    const nodes = R.values(this.props.nodes);
    return this.extendNodesByPinValidness(nodes);
  }
  getLinks() {
    return R.values(this.props.links);
  }

  setClickNodeId(id) {
    this.setState({ clickNodeId: id });
  }

  setMousePosition(mousePosition) {
    this.setState({ mousePosition });
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.SET_MODE_CREATING]: this.props.setModeCreating,
      [COMMAND.DELETE_SELECTION]: this.props.actions.deleteSelection,
      [COMMAND.DESELECT]: this.deselectAll,
    };
  }

  isDragging() {
    return !R.isEmpty(this.dragging);
  }

  extendNodesByPinValidness(nodes) {
    if (!this.props.linkingPin) {
      return nodes;
    }

    const pinsValidation = EditorSelectors.getValidPins(
      this.props.nodes,
      this.props.links,
      this.props.linkingPin
    );

    return R.map(
      (node) => {
        const pvs = R.filter(R.propEq('nodeId', node.id), pinsValidation);
        if (pvs.length === 0) { return node; }

        const fns = R.map(
          pv => R.assocPath(['pins', pv.pinKey, 'validness'], pv.validness),
          pvs
        );

        return R.apply(R.pipe, fns)(node);
      },
      nodes
    );
  }

  dragNode(mousePosition) { // TODO: pass deltaPosition here, manage this.dragging somewhere else
    if (this.state.clickNodeId === null) {
      return;
    }

    const dragId = this.state.clickNodeId;
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

    this.props.actions.dragNode(dragId, newPosition);
  }

  deselectAll() {
    this.props.actions.deselectAll();
  }

  render() {
    const nodes = this.getNodes();
    const links = this.getLinks();

    return (
      <HotKeys
        handlers={this.getHotkeyHandlers()}
        className="PatchWrapper"
      >
        <PatchSVG
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
        >
          <BackgroundLayer
            width={this.props.size.width}
            height={this.props.size.height}
            onClick={this.deselectAll}
          />
          <LinksLayer
            links={links}
            onClick={this.onLinkClick}
          />
          <NodesLayer
            nodes={nodes}
            onMouseDown={this.onNodeMouseDown}
            onPinMouseDown={this.onPinMouseDown}
            onPinMouseUp={this.onPinMouseUp}
          />
          <GhostsLayer
            mousePosition={this.state.mousePosition}
            mode={this.props.mode}
            ghostNode={this.props.ghostNode}
            ghostLink={this.props.ghostLink}
          />
        </PatchSVG>
      </HotKeys>
    );
  }
}

Patch.propTypes = {
  size: React.PropTypes.any.isRequired,
  actions: React.PropTypes.objectOf(React.PropTypes.func),
  nodes: React.PropTypes.any,
  links: React.PropTypes.any,
  linkingPin: React.PropTypes.object,
  selection: React.PropTypes.array,
  selectedNodeType: React.PropTypes.string,
  patchId: React.PropTypes.string,
  mode: React.PropTypes.object,
  ghostNode: React.PropTypes.any,
  ghostLink: React.PropTypes.any,

  setModeCreating: React.PropTypes.func,
};

const mapStateToProps = (state) => {
  const project = core.getProject(state);
  const curPatchId = EditorSelectors.getCurrentPatchId(state);
  const defNodes = core.dereferencedNodes(project, curPatchId);
  const defLinks = core.dereferencedLinks(project, curPatchId);

  return {
    nodes: EditorSelectors.viewNodes(state, defNodes),
    links: EditorSelectors.viewLinks(state, defLinks),

    patch: core.getPatchById(project, curPatchId),
    nodeTypes: core.dereferencedNodeTypes(state),

    selection: EditorSelectors.getSelection(state),
    selectedNodeType: EditorSelectors.getSelectedNodeType(state),
    patchId: EditorSelectors.getCurrentPatchId(state),
    mode: EditorSelectors.getModeChecks(state),
    linkingPin: EditorSelectors.getLinkingPin(state),
    ghostNode: EditorSelectors.getNodeGhost(state, curPatchId),
    ghostLink: EditorSelectors.getLinkGhost(state, curPatchId),
  };
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    addAndSelectNode: EditorActions.addAndSelectNode,
    moveNode: ProjectActions.moveNode,
    dragNode: ProjectActions.dragNode,
    deselectAll: EditorActions.deselectAll,
    deleteSelection: EditorActions.deleteSelection,
    selectLink: EditorActions.selectLink,
    selectNode: EditorActions.selectNode,
    linkPin: EditorActions.linkPin,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Patch);
