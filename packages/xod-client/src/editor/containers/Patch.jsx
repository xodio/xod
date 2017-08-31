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

import { isInput } from '../../utils/browser';
import { COMMAND } from '../../utils/constants';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import PatchSVG from '../../project/components/PatchSVG';
import * as Layers from '../../project/components/layers';

import {
  snapNodePositionToSlots,
  snapNodeSizeToSlots,
  addPoints,
  subtractPoints,
  pointToSize,
  SLOT_SIZE,
  NODE_HEIGHT,
} from '../../project/nodeLayout';

const initialState = {
  mouseOffsetFromClickedEntity: { x: 0, y: 0 },
  mousePosition: { x: 0, y: 0 },
  dragStartPosition: { x: 0, y: 0 },
  isMouseDown: false,
};

const getOffsetMatrix = ({ x, y }) => `matrix(1, 0, 0, 1, ${x}, ${y})`;

const isMiddleButtonPressed = R.pathEq(['nativeEvent', 'which'], 2);

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.state = initialState;

    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    this.onNodeMouseDown = this.onNodeMouseDown.bind(this);

    this.onPinMouseDown = this.onPinMouseDown.bind(this);
    this.onPinMouseUp = this.onPinMouseUp.bind(this);

    this.onLinkClick = this.onLinkClick.bind(this);

    this.onCommentMouseDown = this.onCommentMouseDown.bind(this);
    this.onCommentResizeHandleMouseDown = this.onCommentResizeHandleMouseDown.bind(this);

    this.onDeleteSelection = this.onDeleteSelection.bind(this);
  }

  onMouseDown(event) {
    const middleButtonPressed = isMiddleButtonPressed(event);

    if (!(this.props.mode === EDITOR_MODE.PANNING || middleButtonPressed)) return;

    if (middleButtonPressed) {
      this.props.actions.setMode(EDITOR_MODE.PANNING);
    }

    this.updateMousePosition(event, () => {
      this.setState({
        isMouseDown: true,
        dragStartPosition: R.clone(this.state.mousePosition),
      });
    });
  }

  onNodeMouseDown(event, nodeId) {
    if (isMiddleButtonPressed(event) || this.props.mode === EDITOR_MODE.PANNING) return;

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
    if (isMiddleButtonPressed(event) || this.props.mode === EDITOR_MODE.PANNING) return;

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
    if (isMiddleButtonPressed(event) || this.props.mode === EDITOR_MODE.PANNING) return;

    this.props.actions.selectComment(commentId);

    this.updateMousePosition(event);

    this.setState({ isMouseDown: true });
    this.props.actions.setMode(EDITOR_MODE.RESIZING_SELECTION);
  }

  onDoubleClick(event) {
    this.updateMousePosition(event,
      () => this.props.onDoubleClick(
        snapNodePositionToSlots(this.state.mousePosition)
      )
    );
  }

  onPinMouseDown(event, nodeId, pinKey) {
    if (isMiddleButtonPressed(event) || this.props.mode === EDITOR_MODE.PANNING) return;

    this.updateMousePosition(event);
    this.props.actions.linkPin(nodeId, pinKey);
  }
  onPinMouseUp(event, nodeId, pinKey) {
    if (isMiddleButtonPressed(event) || this.props.mode === EDITOR_MODE.PANNING) return;

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

  onMouseUp(event) {
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

    if (this.props.mode === EDITOR_MODE.PANNING) {
      this.props.actions.setOffset(this.getOffset());

      if (isMiddleButtonPressed(event)) {
        this.props.actions.setMode(EDITOR_MODE.DEFAULT);
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

  onKeyDown(event) {
    if (isInput(event)) return;

    if (
      event.key === ' ' &&
      !this.state.isMouseDown &&
      this.props.mode === EDITOR_MODE.SELECTING
    ) {
      this.props.actions.setMode(EDITOR_MODE.PANNING);
    }
  }

  onKeyUp(event) {
    if (
      event.key === ' ' &&
      this.props.mode === EDITOR_MODE.PANNING
    ) {
      if (this.state.isMouseDown) {
        this.props.actions.setOffset(this.getOffset());
        this.setState({ isMouseDown: false });
      }

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
    if (isInput(event)) return;

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
          y: R.max(NODE_HEIGHT),
        }),
        subtractPoints
      )(this.state.mousePosition, entity.position);
    }

    return {};
  }

  getOffset() {
    return (this.props.mode === EDITOR_MODE.PANNING && this.state.isMouseDown)
      ? addPoints(this.props.offset, subtractPoints(
          this.state.mousePosition,
          this.state.dragStartPosition
        ))
      : this.props.offset;
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
        x: event.clientX - bbox.left - this.props.offset.x,
        y: event.clientY - bbox.top - this.props.offset.y,
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

    const isInPanningMode = this.props.mode === EDITOR_MODE.PANNING;
    const isPanning = isInPanningMode && this.state.isMouseDown;

    return (
      <HotKeys
        handlers={this.getHotkeyHandlers()}
        className="PatchWrapper"
        onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
      >
        <PatchSVG
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          isInPanningMode={isInPanningMode}
          isPanning={isPanning}
          isInResizingMode={this.props.mode === EDITOR_MODE.RESIZING_SELECTION}
          svgRef={(svg) => { this.patchSvgRef = svg; }}
        >
          <Layers.Background
            width={this.props.size.width}
            height={this.props.size.height}
            onClick={this.props.actions.deselectAll}
            onDoubleClick={this.onDoubleClick}
            offset={this.getOffset()}
          />
          <g transform={getOffsetMatrix(this.getOffset())}>
            <Layers.IdleComments
              draggedCommentId={manipulatedCommentId}
              comments={this.props.comments}
              selection={this.props.selection}
              onMouseDown={this.onCommentMouseDown}
              onResizeHandleMouseDown={this.onCommentResizeHandleMouseDown}
              onFinishEditing={this.props.actions.editComment}
            />
            <Layers.Links
              links={idleLinks}
              selection={this.props.selection}
            />
            <Layers.IdleNodes
              draggedNodeId={draggedNodeId}
              nodes={this.props.nodes}
              selection={this.props.selection}
              linkingPin={this.props.linkingPin}
              onMouseDown={this.onNodeMouseDown}
            />
            <Layers.LinksOverlay
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
            <Layers.DraggedNodeLinks
              node={draggedNode}
              nodePosition={manipulatedEntityPosition}
              links={draggedNodeLinks}
            />
            <Layers.DraggedNode
              node={draggedNode}
              position={manipulatedEntityPosition}
              size={manipulatedEntitySize}
            />
            <Layers.Ghosts
              mousePosition={this.state.mousePosition}
              mode={this.props.mode}
              ghostLink={this.props.ghostLink}
            />
          </g>
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
  mode: PropTypes.oneOf(R.values(EDITOR_MODE)),
  ghostLink: PropTypes.any,
  offset: PropTypes.object,
  onDoubleClick: PropTypes.func.isRequired,
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
  offset: EditorSelectors.getCurrentPatchOffset,
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
    setOffset: EditorActions.setCurrentPatchOffset,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Patch);
