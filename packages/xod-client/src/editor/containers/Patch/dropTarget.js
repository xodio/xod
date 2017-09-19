import { DropTarget } from 'react-dnd';

import { EDITOR_MODE, DRAGGED_ENTITY_TYPE } from '../../constants';

import {
  snapNodePositionToSlots,
} from '../../../project/nodeLayout';


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

    props.actions.addNode(
      patchPath,
      newNodePosition,
      props.patchPath
    );
    props.actions.setMode(EDITOR_MODE.DEFAULT);
  },
  hover(props, monitor, component) { // TODO: performance?
    if (!component.dropTargetRootRef) return;

    component.setModeState(
      EDITOR_MODE.ACCEPTING_DRAGGED_PATCH,
      { previewPosition: getDraggedPatchPosition(props, monitor, component) }
    );
  },
  canDrop(props, monitor) {
    const { patchPath } = monitor.getItem();
    return patchPath !== props.patchPath;
  },
};

export default DropTarget( // eslint-disable-line new-cap
  DRAGGED_ENTITY_TYPE.PATCH,
  dropTarget,
  (conn, monitor) => ({
    connectDropTarget: conn.dropTarget(),
    isPatchDraggedOver: monitor.isOver(),
  })
);

