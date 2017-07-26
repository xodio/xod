import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import SVGLayer from './SVGLayer';
import XODLink from '../Link';
import { addPoints } from '../../nodeLayout';

const updatePinPositions = R.curry((node, newNodePosition, link) => {
  const indexOfPinConnectedToTheDraggedNode =
    link.input.nodeId === node.id
      ? 'input'
      : 'output';

  const draggedPinKey = link[indexOfPinConnectedToTheDraggedNode].pinKey;
  const pinPosition = addPoints(
    newNodePosition,
    node.pins[draggedPinKey].position
  );

  const pinPositionKey = { input: 'from', output: 'to' }[indexOfPinConnectedToTheDraggedNode];

  return R.assoc(pinPositionKey, pinPosition, link);
});

class DraggedNodeLinksLayer extends React.PureComponent {
  getLinksWithUpdatedPositions() {
    const {
      node,
      nodePosition,
      links,
    } = this.props;

    return R.map(
      updatePinPositions(node, nodePosition),
      links
    );
  }

  render() {
    if (!this.props.node) return null;

    const links = this.getLinksWithUpdatedPositions();

    return (
      <SVGLayer
        name="DraggedNodeLinksLayer"
        className="DraggedNodeLinksLayer"
      >
        {links.map(link =>
          <XODLink
            key={link.id}
            id={link.id}
            from={link.from}
            to={link.to}
            type={link.type}
          />
        )}
      </SVGLayer>
    );
  }
}

DraggedNodeLinksLayer.displayName = 'DraggedNodeLinksLayer';

DraggedNodeLinksLayer.propTypes = {
  node: PropTypes.object,
  nodePosition: PropTypes.object,
  links: PropTypes.array,
};

export default DraggedNodeLinksLayer;
