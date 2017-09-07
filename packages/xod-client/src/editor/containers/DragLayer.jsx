import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { DragLayer } from 'react-dnd';

import * as XP from 'xod-project';

import * as ProjectSelectors from '../../project/selectors';
import { patchToNodeProps } from '../../project/utils';
import { addPoints, subtractPoints } from '../../project/nodeLayout';
import Node from '../../project/components/Node';

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

function getItemStyles({ initialClientOffset, initialSourceClientOffset, currentOffset }) {
  if (!initialClientOffset || !initialSourceClientOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }

  const offsetFromSourceRoot = subtractPoints(initialClientOffset, initialSourceClientOffset);
  const { x, y } = addPoints(offsetFromSourceRoot, currentOffset);

  return {
    transform: `translate(${x}px, ${y}px)`,
  };
}

const renderPatchAsNode = (patchPath, project) => R.compose(
  R.map(R.compose(
    props => (
      <Node {...props} isDragged />
    ),
    patchToNodeProps
  )),
  XP.getPatchByPath(patchPath)
)(project);

const CustomDragLayer = ({
  item,
  initialClientOffset,
  initialSourceClientOffset,
  currentOffset,
  isDragging,
  project,
}) => {
  if (!isDragging) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles({ initialClientOffset, initialSourceClientOffset, currentOffset })}>
        {renderPatchAsNode(item.patchPath, project).getOrElse(null)}
      </div>
    </div>
  );
};

const pointPropType = PropTypes.shape({
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
});

CustomDragLayer.propTypes = {
  item: PropTypes.object,
  initialClientOffset: pointPropType,
  initialSourceClientOffset: pointPropType,
  currentOffset: pointPropType,
  isDragging: PropTypes.bool.isRequired,
  project: PropTypes.object.isRequired,
};

const mapStateToProps = R.applySpec({
  project: ProjectSelectors.getProject,
});

export default R.compose(
  connect(mapStateToProps),
  DragLayer(monitor => ({ // eslint-disable-line new-cap
    item: monitor.getItem(),
    // TODO: add monitor.getItemType() when there are more types
    initialClientOffset: monitor.getInitialClientOffset(),
    initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }))
)(CustomDragLayer);
