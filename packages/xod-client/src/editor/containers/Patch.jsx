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

import { COMMAND } from '../../utils/constants';
import PatchSVG from '../../project/components/PatchSVG';
import BackgroundLayer from '../../project/components/BackgroundLayer';
import IdleNodesLayer from '../../project/components/NodesLayer';
import LinksLayer from '../../project/components/LinksLayer';
import GhostsLayer from '../../project/components/GhostsLayer';
import SnappingPreviewLayer from '../../project/components/SnappingPreviewLayer';
import DraggedNodeLayer from '../../project/components/DraggedNodeLayer';
import DraggedNodeLinksLayer from '../../project/components/DraggedNodeLinksLayer';
import {
  addNodesPositioning,
  addLinksPositioning,
  snapNodePositionToSlots,
  substractPoints,
} from '../../project/nodeLayout';

const initialState = {
  mouseOffsetFromClickedNode: { x: 0, y: 0 },
  isNodeMouseDown: false,
  mousePosition: { x: 0, y: 0 },
};

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.state = initialState;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.onNodeMouseDown = this.onNodeMouseDown.bind(this);
    this.onNodeSelect = this.onNodeSelect.bind(this);

    this.onPinMouseDown = this.onPinMouseDown.bind(this);
    this.onPinMouseUp = this.onPinMouseUp.bind(this);

    this.onLinkClick = this.onLinkClick.bind(this);

    this.getDraggedNodeId = this.getDraggedNodeId.bind(this);
    this.extendNodesByPinValidness = this.extendNodesByPinValidness.bind(this);
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

  onNodeMouseDown(event, nodeId) {
    this.onNodeSelect(nodeId);

    const clickedNode = this.props.nodes[nodeId];
    const mouseOffsetFromClickedNode =
      substractPoints(this.state.mousePosition, clickedNode.position);

    this.setState({
      isNodeMouseDown: true,
      mouseOffsetFromClickedNode,
    });
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
      this.props.actions.deselectAll();
    }
  }

  onMouseMove(event) {
    const svg = findRootSVG(event.target);
    const bbox = svg.getBoundingClientRect();

    // TODO: could be optimized, but for now we are
    // always keeping an up-to-date mouse position in state
    this.setMousePosition({
      x: event.clientX - bbox.left,
      y: event.clientY - bbox.top,
    });
  }

  onMouseUp(event) {
    const draggedNodeId = this.getDraggedNodeId();
    if (draggedNodeId) {
      this.props.actions.moveNode(
        draggedNodeId,
        snapNodePositionToSlots(this.getDraggedNodePosition())
      );
    }

    if (this.props.mode.isCreatingNode) {
      this.onCreateNode(event);
    }

    this.setState({
      isNodeMouseDown: false,
      mouseOffsetFromClickedNode: initialState.mouseOffsetFromClickedNode,
    });
  }

  onCreateNode() {
    const position = snapNodePositionToSlots(this.state.mousePosition);
    const nodeTypeId = this.props.selectedNodeType;
    const curPatchId = this.props.patchId;
    this.props.actions.addAndSelectNode(nodeTypeId, position, curPatchId);
  }

  getIdleNodes() {
    return R.compose(
      this.extendNodesByPinValidness,
      R.values,
      R.omit([this.getDraggedNodeId()])
    )(this.props.nodes);
  }

  setMousePosition(mousePosition) {
    this.setState({ mousePosition });
  }

  getDraggedNodeId() {
    if (!this.props.mode.isEditing) return null;
    if (!this.state.isNodeMouseDown) return null;

    const { entity, id } = R.head(this.props.selection) || {};
    return entity === 'Node' ? id : null;
  }

  getDraggedNodePosition() {
    return substractPoints(
      this.state.mousePosition,
      this.state.mouseOffsetFromClickedNode
    );
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.SET_MODE_CREATING]: this.props.setModeCreating,
      [COMMAND.DELETE_SELECTION]: this.props.actions.deleteSelection,
      [COMMAND.DESELECT]: this.props.actions.deselectAll,
    };
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

  render() {
    const links = R.values(this.props.links);

    const draggedNodeId = this.getDraggedNodeId();
    const draggedNode = this.props.nodes[draggedNodeId];
    const draggedNodePosition = this.getDraggedNodePosition();

    const isDraggedNodeLink = EditorSelectors.isLinkConnectedToNode(draggedNodeId);
    const draggedNodeLinks = R.filter(isDraggedNodeLink, links);

    const idleNodes = this.getIdleNodes();
    const idleLinks = R.reject(isDraggedNodeLink, links);

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
            onClick={this.props.actions.deselectAll}
          />
          <IdleNodesLayer
            nodes={idleNodes}
            onMouseDown={this.onNodeMouseDown}
            onPinMouseDown={this.onPinMouseDown}
            onPinMouseUp={this.onPinMouseUp}
          />
          <SnappingPreviewLayer
            draggedNodeId={draggedNodeId}
            draggedNodePosition={draggedNodePosition}
            nodes={this.props.nodes}
          />
          <LinksLayer
            links={idleLinks}
            onClick={this.onLinkClick}
          />
          <DraggedNodeLayer
            node={draggedNode}
            position={draggedNodePosition}
          />
          <DraggedNodeLinksLayer
            node={draggedNode}
            nodePosition={draggedNodePosition}
            links={draggedNodeLinks}
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
  const nodesWithPositioning = addNodesPositioning(defNodes);

  const defLinks = core.dereferencedLinks(project, curPatchId);
  const linksWithPositioning = addLinksPositioning(nodesWithPositioning, defLinks);

  return {
    nodes: EditorSelectors.markSelectedNodes(state, nodesWithPositioning),
    links: EditorSelectors.markSelectedLinks(state, linksWithPositioning),

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
