import { DropTarget } from 'react-dnd';

import { EDITOR_MODE, DRAGGED_ENTITY_TYPE } from '../../constants';

import {
  snapNodePositionToSlots,
  slotPositionToPixels,
} from '../../../project/nodeLayout';

const getDraggedPatchPosition = (props, monitor, component) => {
  const globalDropPosition = monitor.getClientOffset();
  const bbox = component.dropTargetRootRef.getBoundingClientRect();
  const pxOffset = slotPositionToPixels(props.offset);

  return snapNodePositionToSlots({
    x: globalDropPosition.x - bbox.left - pxOffset.x,
    y: globalDropPosition.y - bbox.top - pxOffset.y,
  });
};

const dropTarget = {
  drop(props, monitor, component) {
    if (!component.dropTargetRootRef) return;

    const newNodePosition = getDraggedPatchPosition(props, monitor, component);

    const { patchPath } = monitor.getItem();

    component.addNode(patchPath, newNodePosition);
    component.goToDefaultMode();
  },
  hover(props, monitor, component) {
    if (!component.dropTargetRootRef) return;

    if (!monitor.isOver()) return;

    component.setModeStateThrottled(EDITOR_MODE.ACCEPTING_DRAGGED_PATCH, {
      previewPosition: getDraggedPatchPosition(props, monitor, component),
    });
  },
  canDrop(props, monitor) {
    const { patchPath } = monitor.getItem();
    return patchPath !== props.patchPath;
  },
};

// eslint-disable-next-line new-cap
export default DropTarget(
  DRAGGED_ENTITY_TYPE.PATCH,
  dropTarget,
  (conn, monitor) => ({
    connectDropTarget: conn.dropTarget(),
    isPatchDraggedOver: monitor.isOver(),
  })
);
