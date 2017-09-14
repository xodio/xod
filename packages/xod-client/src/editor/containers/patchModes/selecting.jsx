import R from 'ramda';
import React from 'react';
import { HotKeys } from 'react-hotkeys';

import { EDITOR_MODE, SELECTION_ENTITY_TYPE } from '../../constants';
import { isInput } from '../../../utils/browser';
import { COMMAND } from '../../../utils/constants';

import PatchSVG from '../../../project/components/PatchSVG';
import * as Layers from '../../../project/components/layers';

import { snapNodePositionToSlots } from '../../../project/nodeLayout';

export const getOffsetMatrix = ({ x, y }) => `matrix(1, 0, 0, 1, ${x}, ${y})`;

export const isMiddleButtonPressed = R.pathEq(['nativeEvent', 'which'], 2);

export const bindApi = (api, fn) => (...args) => fn(api, ...args);

export const getMousePosition = (rootRef, offset, event) => {
  // TODO: warn that we returned default value?
  if (!rootRef) return { x: 0, y: 0 };

  const bbox = rootRef.getBoundingClientRect();

  return {
    x: event.clientX - bbox.left - offset.x,
    y: event.clientY - bbox.top - offset.y,
  };
};

let patchSvgRef = null;

const selectingMode = {
  onEnterMode() {
    return {
      isMouseDownOnMovableObject: false,
    };
  },
  onNodeMouseDown({ props, setState, goToMode }, event, nodeId) {
    if (isMiddleButtonPressed(event)) return;

    if (event.metaKey) {
      props.actions.addEntityToSelection(SELECTION_ENTITY_TYPE.NODE, nodeId);
    } else {
      props.actions.selectNode(nodeId);
    }

    setState({ isMouseDownOnMovableObject: true });
  },
  onCommentMouseDown({ props, setState }, event, commentId) {
    if (isMiddleButtonPressed(event)) return;

    if (event.metaKey) {
      props.actions.addEntityToSelection(SELECTION_ENTITY_TYPE.COMMENT, commentId);
    } else {
      props.actions.selectComment(commentId);
    }

    setState({ isMouseDownOnMovableObject: true });
  },
  onCommentResizeHandleMouseDown(api, event, commentId) {
    if (isMiddleButtonPressed(event)) return;

    api.goToMode(
      EDITOR_MODE.RESIZING_SELECTION,
      {
        resizedCommentId: commentId,
        dragStartPosition: getMousePosition(patchSvgRef, api.props.offset, event),
      }
    );
  },
  onPinMouseDown(api, event, nodeId, pinKey) {
    if (isMiddleButtonPressed(event)) return;

    const didSelectPin = api.props.actions.doPinSelection(nodeId, pinKey);
    if (didSelectPin) {
      const mousePosition = getMousePosition(patchSvgRef, api.props.offset, event);
      api.goToMode(EDITOR_MODE.LINKING, { mousePosition });
    }
  },
  onLinkClick(api, id) {
    if (id.length > 0) {
      api.props.actions.selectLink(id);
    } else {
      api.props.actions.deselectAll();
    }
  },
  onMouseDown(api, event) {
    if (!isMiddleButtonPressed(event)) return;

    const mousePosition = getMousePosition(patchSvgRef, api.props.offset, event);
    api.goToMode(EDITOR_MODE.PANNING, { isPanning: true, panningStartPosition: mousePosition });
  },
  onMouseMove(api, event) {
    if (!api.state.isMouseDownOnMovableObject) return;

    api.goToMode(
      EDITOR_MODE.MOVING_SELECTION,
      {
        dragStartPosition: getMousePosition(patchSvgRef, api.props.offset, event),
      }
    );
  },
  onMouseUp(api) {
    api.setState({ isMouseDownOnMovableObject: false });
  },
  onKeyDown(api, event) {
    if (isInput(event)) return;

    if (event.key === ' ' && !api.state.isMouseDownOnMovableObject) {
      api.goToMode(EDITOR_MODE.PANNING, { isPanning: false });
    }
  },
  onDeleteSelection(api, event) {
    if (isInput(event)) return;

    api.props.actions.deleteSelection();
  },
  onDoubleClick(api, event) {
    R.compose(
      api.props.onDoubleClick,
      snapNodePositionToSlots,
      getMousePosition
    )(patchSvgRef, api.props.offset, event);
  },
  getHotkeyHandlers(api) {
    return {
      [COMMAND.DELETE_SELECTION]: bindApi(api, this.onDeleteSelection),
      [COMMAND.DESELECT]: api.props.actions.deselectAll,
    };
  },
  render(api) {
    return (
      <HotKeys
        handlers={this.getHotkeyHandlers(api)}
        className="PatchWrapper"
        onKeyDown={bindApi(api, this.onKeyDown)}
      >
        <PatchSVG
          onMouseDown={bindApi(api, this.onMouseDown)}
          onMouseMove={bindApi(api, this.onMouseMove)}
          onMouseUp={bindApi(api, this.onMouseUp)}
          svgRef={(svg) => { patchSvgRef = svg; }}
        >
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
            onClick={api.props.actions.deselectAll}
            onDoubleClick={bindApi(api, this.onDoubleClick)}
            offset={api.props.offset}
          />
          <g transform={getOffsetMatrix(api.props.offset)}>
            <Layers.IdleComments
              comments={api.props.comments}
              selection={api.props.selection}
              onMouseDown={bindApi(api, this.onCommentMouseDown)}
              onResizeHandleMouseDown={bindApi(api, this.onCommentResizeHandleMouseDown)}
              onFinishEditing={api.props.actions.editComment}
            />
            <Layers.Links
              links={R.values(api.props.links)}
              selection={api.props.selection}
            />
            <Layers.IdleNodes
              nodes={api.props.nodes}
              selection={api.props.selection}
              linkingPin={api.props.linkingPin}
              onMouseDown={bindApi(api, this.onNodeMouseDown)}
            />
            <Layers.LinksOverlay
              links={R.values(api.props.links)}
              selection={api.props.selection}
              onClick={bindApi(api, this.onLinkClick)}
            />
            <Layers.NodePinsOverlay
              nodes={api.props.nodes}
              linkingPin={api.props.linkingPin}
              onPinMouseDown={bindApi(api, this.onPinMouseDown)}
            />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default selectingMode;
