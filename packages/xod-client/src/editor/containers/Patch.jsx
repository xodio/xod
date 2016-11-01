import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import core from 'xod-core';

import * as EditorActions from '../actions'; // @TODO: remove it!
import * as EditorSelectors from '../selectors';
import * as ProjectActions from '../../project/actions';
import { findRootSVG } from '../../utils/browser';

import { HotKeys } from 'react-hotkeys';
import { COMMAND } from '../../utils/constants';

import PatchSVG from '../../project/components/PatchSVG';
import BackgroundLayer from '../../project/components/BackgroundLayer';
import NodesLayer from '../../project/components/NodesLayer';
import LinksLayer from '../../project/components/LinksLayer';
import GhostsLayer from '../../project/components/GhostsLayer';

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.dragging = {};
    this.state = {
      clickNodeId: null,
      dragNodeId: null,
    };
    this.state.mousePosition = { x: 0, y: 0 };

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onNodeSelect = this.onNodeSelect.bind(this);
    this.onNodeMouseDown = this.onNodeMouseDown.bind(this);
    this.onPinMouseDown = this.onPinMouseDown.bind(this);
    this.onPinMouseUp = this.onPinMouseUp.bind(this);
    this.onLinkClick = this.onLinkClick.bind(this);

    this.deselectAll = this.deselectAll.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const haveGhost = R.either(R.prop('ghostNode'), R.prop('ghostLink'));
    const notNil = R.complement(R.isNil);
    const isDraggingGhost = R.useWith(notNil, [haveGhost, haveGhost]);

    const isChangingMousePosition = nextState.mousePosition !== this.state.mousePosition;

    const isDraggingNode = R.complement(R.isEmpty);

    const shouldNotUpdateMousePosition = (
      !(
        isDraggingGhost(this.props, nextProps) ||
        isDraggingNode(this.dragging)
      ) &&
      isChangingMousePosition
    );

    if (shouldNotUpdateMousePosition) { return false; }

    return true;
  }

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
    if (this.state.dragNodeId) {
      const dragId = this.state.dragNodeId;
      const draggedPos = this.props.nodes[dragId].position;

      this.setDragNodeId(null);
      this.props.actions.moveNode(dragId, draggedPos);
    }
    if (this.state.clickNodeId) {
      this.setClickNodeId(null);
    }
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
    let nodes = R.values(this.props.nodes);
    nodes = this.extendNodesByPinValidness(nodes);
    return nodes;
  }
  getLinks() {
    return R.values(this.props.links);
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
    this.setState(
      R.assoc('mousePosition', pos, this.state)
    );
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.SET_MODE_CREATING]: this.props.setModeCreating,
      [COMMAND.DELETE_SELECTION]: this.props.actions.deleteSelection,
      [COMMAND.DESELECT]: this.deselectAll,
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

    return R.pipe(
      R.map(node => {
        const pvs = R.filter(R.propEq('nodeId', node.id), pinsValidation);
        if (pvs.length === 0) { return node; }

        const add = R.map(pv => R.assocPath(['pins', pv.pinKey, 'validness'], pv.validness), pvs);
        return R.reduce((n, a) => a(n), node, add);
      })
    )(nodes);
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

      this.props.actions.dragNode(dragId, newPosition);

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
  patch: React.PropTypes.any,
  linkingPin: React.PropTypes.object,
  selection: React.PropTypes.array,
  selectedNodeType: React.PropTypes.string,
  patchId: React.PropTypes.string,
  nodeTypes: React.PropTypes.object,
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

const mapDispatchToProps = (dispatch) => ({
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
