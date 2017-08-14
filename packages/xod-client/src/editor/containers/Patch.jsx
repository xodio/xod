import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';

import * as EditorActions from '../actions';
import * as EditorSelectors from '../selectors';
import { SELECTION_ENTITY_TYPE, EDITOR_MODE } from '../constants';

import * as ProjectActions from '../../project/actions';
import * as ProjectSelectors from '../../project/selectors';
import * as ProjectUtils from '../../project/utils';
import { RenderableLink, RenderableNode, RenderableComment } from '../../project/types';

import { COMMAND } from '../../utils/constants';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import PatchSVG from '../../project/components/PatchSVG';
import * as Layers from '../../project/components/layers';

import {
  snapNodePositionToSlots,
  snapNodeSizeToSlots,
  subtractPoints,
  pointToSize,
  SLOT_SIZE,
} from '../../project/nodeLayout';

const initialState = {
  mouseOffsetFromClickedEntity: { x: 0, y: 0 },
  mousePosition: { x: 0, y: 0 },
  isMouseDown: false,
};

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.state = initialState;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.onNodeMouseDown = this.onNodeMouseDown.bind(this);

    this.onPinMouseDown = this.onPinMouseDown.bind(this);
    this.onPinMouseUp = this.onPinMouseUp.bind(this);

    this.onLinkClick = this.onLinkClick.bind(this);

    this.onCommentMouseDown = this.onCommentMouseDown.bind(this);
    this.onCommentResizeHandleMouseDown = this.onCommentResizeHandleMouseDown.bind(this);

    this.onDeleteSelection = this.onDeleteSelection.bind(this);
  }

  onNodeMouseDown(event, nodeId) {
    this.props.actions.selectNode(nodeId);
    const clickedNode = this.props.nodes[nodeId];

    this.updateMousePosition(event, () => {
      const mouseOffsetFromClickedEntity =
        subtractPoints(this.state.mousePosition, clickedNode.position);

      this.setState({
        isMouseDown: true,
        mouseOffsetFromClickedEntity,
      });
    });
  }

  onCommentMouseDown(event, commentId) {
    this.props.actions.selectComment(commentId);
    const clickedComment = this.props.comments[commentId];

    this.updateMousePosition(event, () => {
      const mouseOffsetFromClickedEntity =
        subtractPoints(this.state.mousePosition, clickedComment.position);

      this.setState({
        isMouseDown: true,
        mouseOffsetFromClickedEntity,
      });
    });
  }

  onCommentResizeHandleMouseDown(event, commentId) {
    this.props.actions.selectComment(commentId);

    this.updateMousePosition(event);

    this.setState({ isMouseDown: true });
    this.props.actions.setMode(EDITOR_MODE.RESIZING_SELECTION);
  }

  onPinMouseDown(event, nodeId, pinKey) {
    this.updateMousePosition(event);
    this.props.actions.linkPin(nodeId, pinKey);
  }
  onPinMouseUp(event, nodeId, pinKey) {
    this.updateMousePosition(event);
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
    const needsPositionUpdate = this.state.isMouseDown || this.props.mode === EDITOR_MODE.LINKING;
    if (!needsPositionUpdate) return;

    // jump to move mode only if user actually drags something
    if (
      this.state.isMouseDown &&
      this.props.mode === EDITOR_MODE.SELECTING
    ) {
      this.props.actions.setMode(EDITOR_MODE.MOVING_SELECTION);
    }

    this.updateMousePosition(event);
  }

  onMouseUp() {
    const draggedNodeId = this.getManipulatedEntityId(SELECTION_ENTITY_TYPE.NODE);
    if (draggedNodeId) {
      this.props.actions.moveNode(
        draggedNodeId,
        snapNodePositionToSlots(this.getManipulatedEntityPosition())
      );
    }

    const draggedCommentId = this.getManipulatedEntityId(SELECTION_ENTITY_TYPE.COMMENT);
    if (draggedCommentId) {
      this.props.actions.moveComment(
        draggedCommentId,
        snapNodePositionToSlots(this.getManipulatedEntityPosition())
      );
      if (this.props.mode === EDITOR_MODE.RESIZING_SELECTION) {
        this.props.actions.resizeComment(
          draggedCommentId,
          snapNodeSizeToSlots(this.getManipulatedEntitySize())
        );
      }
    }

    this.setState({
      isMouseDown: false,
      mouseOffsetFromClickedEntity: initialState.mouseOffsetFromClickedEntity,
    });

    if (this.isInManipulationMode()) {
      this.props.actions.setMode(EDITOR_MODE.DEFAULT);
    }
  }

  onCreateNode() {
    const position = snapNodePositionToSlots(this.state.mousePosition);
    const nodeTypeId = this.props.selectedNodeType;
    const currentPatchPath = this.props.patchPath;
    this.props.actions.addAndSelectNode(nodeTypeId, position, currentPatchPath);
  }

  onDeleteSelection(event) {
    if (R.contains(event.target.type, ['textarea', 'input'])) return;

    this.props.actions.deleteSelection();
  }

  getManipulatedEntityId(entityType) {
    if (!this.isInManipulationMode()) {
      return null;
    }

    const { entity, id } = R.head(this.props.selection);
    return entity === entityType ? id : null;
  }

  getSelectedEntity() {
    if (R.isEmpty(this.props.selection)) {
      return null;
    }

    const { entity, id } = R.head(this.props.selection);

    if (entity === SELECTION_ENTITY_TYPE.COMMENT) {
      return this.props.comments[id];
    } else if (entity === SELECTION_ENTITY_TYPE.NODE) {
      return this.props.nodes[id];
    }

    return null;
  }

  getManipulatedEntityPosition() {
    const entity = this.getSelectedEntity();
    if (!entity) return {};

    if (this.props.mode === EDITOR_MODE.MOVING_SELECTION) {
      return subtractPoints(
        this.state.mousePosition,
        this.state.mouseOffsetFromClickedEntity
      );
    }

    if (this.props.mode === EDITOR_MODE.RESIZING_SELECTION) {
      return entity.position;
    }

    return {};
  }

  getManipulatedEntitySize() {
    const entity = this.getSelectedEntity();
    if (!entity) return {};

    if (this.props.mode === EDITOR_MODE.MOVING_SELECTION) {
      return entity.size;
    }

    if (this.props.mode === EDITOR_MODE.RESIZING_SELECTION) {
      return R.compose(
        pointToSize,
        R.evolve({
          x: R.max(SLOT_SIZE.WIDTH),
          y: R.max(SLOT_SIZE.HEIGHT),
        }),
        subtractPoints
      )(this.state.mousePosition, entity.position);
    }

    return {};
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.DELETE_SELECTION]: this.onDeleteSelection,
      [COMMAND.DESELECT]: this.props.actions.deselectAll,
    };
  }

  isInManipulationMode() {
    return (
      !R.isEmpty(this.props.selection)
      && (
        this.props.mode === EDITOR_MODE.MOVING_SELECTION ||
        this.props.mode === EDITOR_MODE.RESIZING_SELECTION
      )
    );
  }

  updateMousePosition(event, setStateCallback) {
    if (!this.patchSvgRef) return;
    const bbox = this.patchSvgRef.getBoundingClientRect();

    this.setState({
      mousePosition: {
        x: event.clientX - bbox.left,
        y: event.clientY - bbox.top,
      },
    }, setStateCallback);
  }

  render() {
    const links = R.values(this.props.links);

    const draggedNodeId = this.getManipulatedEntityId(SELECTION_ENTITY_TYPE.NODE);
    const draggedNode = this.props.nodes[draggedNodeId];

    const isDraggedNodeLink = ProjectUtils.isLinkConnectedToNode(draggedNodeId);
    const draggedNodeLinks = R.filter(isDraggedNodeLink, links);
    const idleLinks = R.reject(isDraggedNodeLink, links);

    const manipulatedCommentId = this.getManipulatedEntityId(SELECTION_ENTITY_TYPE.COMMENT);
    const manipulatedComment = this.props.comments[manipulatedCommentId];

    const manipulatedEntityPosition = this.getManipulatedEntityPosition();
    const manipulatedEntitySize = this.getManipulatedEntitySize();

    return (
      <HotKeys
        handlers={this.getHotkeyHandlers()}
        className="PatchWrapper"
      >
        <PatchSVG
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          svgRef={(svg) => { this.patchSvgRef = svg; }}
        >
          <Layers.Background
            width={this.props.size.width}
            height={this.props.size.height}
            onClick={this.props.actions.deselectAll}
          />
          <Layers.IdleComments
            draggedCommentId={manipulatedCommentId}
            comments={this.props.comments}
            selection={this.props.selection}
            onMouseDown={this.onCommentMouseDown}
            onResizeHandleMouseDown={this.onCommentResizeHandleMouseDown}
            onFinishEditing={this.props.actions.editComment}
          />
          <Layers.IdleNodes
            draggedNodeId={draggedNodeId}
            nodes={this.props.nodes}
            selection={this.props.selection}
            linkingPin={this.props.linkingPin}
            onMouseDown={this.onNodeMouseDown}
          />
          <Layers.Links
            links={idleLinks}
            selection={this.props.selection}
            onClick={this.onLinkClick}
          />
          <Layers.NodePinsOverlay
            nodes={this.props.nodes}
            linkingPin={this.props.linkingPin}
            onPinMouseDown={this.onPinMouseDown}
            onPinMouseUp={this.onPinMouseUp}
          />
          {this.isInManipulationMode() ? (
            <Layers.SnappingPreview
              draggedEntityPosition={manipulatedEntityPosition}
              draggedEntitySize={manipulatedEntitySize}
            />
          ) : null}
          <Layers.ManipulatedComment
            comment={manipulatedComment}
            position={manipulatedEntityPosition}
            size={manipulatedEntitySize}
          />
          <Layers.DraggedNode
            node={draggedNode}
            position={manipulatedEntityPosition}
            size={manipulatedEntitySize}
          />
          <Layers.DraggedNodeLinks
            node={draggedNode}
            nodePosition={manipulatedEntityPosition}
            links={draggedNodeLinks}
          />
          <Layers.Ghosts
            mousePosition={this.state.mousePosition}
            mode={this.props.mode}
            ghostLink={this.props.ghostLink}
          />
        </PatchSVG>
      </HotKeys>
    );
  }
}

Patch.propTypes = {
  size: PropTypes.any.isRequired,
  actions: PropTypes.objectOf(PropTypes.func),
  nodes: sanctuaryPropType($.StrMap(RenderableNode)),
  links: sanctuaryPropType($.StrMap(RenderableLink)),
  comments: sanctuaryPropType($.StrMap(RenderableComment)),
  linkingPin: PropTypes.object,
  selection: PropTypes.array,
  selectedNodeType: PropTypes.string,
  patchPath: PropTypes.string,
  mode: PropTypes.object,
  ghostLink: PropTypes.any,
};

const mapStateToProps = R.applySpec({
  nodes: ProjectSelectors.getRenderableNodes,
  links: ProjectSelectors.getRenderableLinks,
  comments: ProjectSelectors.getRenderableComments,
  selection: EditorSelectors.getSelection,
  selectedNodeType: EditorSelectors.getSelectedNodeType,
  linkingPin: EditorSelectors.getLinkingPin,
  patchPath: EditorSelectors.getCurrentPatchPath,
  mode: EditorSelectors.getMode,
  ghostLink: ProjectSelectors.getLinkGhost,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    addAndSelectNode: EditorActions.addAndSelectNode,
    moveNode: ProjectActions.moveNode,
    editComment: ProjectActions.editComment,
    moveComment: ProjectActions.moveComment,
    resizeComment: ProjectActions.resizeComment,
    deselectAll: EditorActions.deselectAll,
    deleteSelection: EditorActions.deleteSelection,
    selectLink: EditorActions.selectLink,
    selectNode: EditorActions.selectNode,
    selectComment: EditorActions.selectComment,
    linkPin: EditorActions.linkPin,
    setMode: EditorActions.setMode,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Patch);
