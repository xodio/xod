import { DropTarget } from 'react-dnd';

import { EDITOR_MODE, DRAGGED_ENTITY_TYPE } from '../../constants';

import { snapNodePositionToSlots } from '../../../project/nodeLayout';

const getDraggedPatchPosition = (props, monitor, component) => {
  const globalDropPosition = monitor.getClientOffset();
  const bbox = component.dropTargetRootRef.getBoundingClientRect();

  return snapNodePositionToSlots({
    x: globalDropPosition.x - bbox.left - props.offset.x,
    y: globalDropPosition.y - bbox.top - props.offset.y,
  });
};

const dropTarget = {
  drop(props, monitor, component) {
    if (!component.dropTargetRootRef) return;

    const newNodePosition = getDraggedPatchPosition(props, monitor, component);

    const { patchPath } = monitor.getItem();

    props.actions.addNode(patchPath, newNodePosition, props.patchPath);
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
