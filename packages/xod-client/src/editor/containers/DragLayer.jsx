import * as R from 'ramda';
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

class CustomDragLayer extends React.PureComponent {
  getItemStyles() {
    const {
      initialClientOffset,
      initialSourceClientOffset,
      currentOffset,
    } = this.props;

    if (!initialClientOffset || !initialSourceClientOffset || !currentOffset) {
      return {
        display: 'none',
      };
    }

    const offsetFromSourceRoot = subtractPoints(
      initialClientOffset,
      initialSourceClientOffset
    );
    const { x, y } = addPoints(offsetFromSourceRoot, currentOffset);

    return {
      transform: `translate(${x}px, ${y}px)`,
    };
  }

  renderPatchAsNode() {
    return R.compose(
      maybeRenderedPatch => maybeRenderedPatch.getOrElse(null),
      R.map(
        R.compose(
          props => <Node {...props} isDragged noEvents />,
          patchToNodeProps(false)
        )
      ),
      XP.getPatchByPath(this.props.item.patchPath)
    )(this.props.project);
  }

  render() {
    if (!this.props.isDragging) {
      return null;
    }

    return (
      <div style={layerStyles}>
        <div style={this.getItemStyles()}>{this.renderPatchAsNode()}</div>
      </div>
    );
  }
}

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
  // eslint-disable-next-line new-cap
  DragLayer(monitor => ({
    item: monitor.getItem(),
    // TODO: add monitor.getItemType() when there are more types
    initialClientOffset: monitor.getInitialClientOffset(),
    initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }))
)(CustomDragLayer);
