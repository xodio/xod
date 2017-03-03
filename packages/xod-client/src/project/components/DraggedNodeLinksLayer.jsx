import R from 'ramda';
import React from 'react';

import SVGLayer from './SVGLayer';
import XODLink from './Link';
import { addPoints } from '../nodeLayout';

class DraggedNodeLinksLayer extends React.PureComponent {
  getLinksWithUpdatedPositions() {
    const {
      node,
      nodePosition,
      links,
    } = this.props;

    return R.map(
      (link) => {
        const indexOfPinConnectedToTheDraggedNode =
          R.findIndex(R.propEq('nodeId', node.id), link.pins);

        const draggedPinKey = link.pins[indexOfPinConnectedToTheDraggedNode].pinKey;
        const pinPosition = addPoints(
          nodePosition,
          node.pins[draggedPinKey].position
        );

        const pinPositionKey = ['from', 'to'][indexOfPinConnectedToTheDraggedNode];

        return R.assoc(pinPositionKey, pinPosition, link);
      },
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
  node: React.PropTypes.object,
  nodePosition: React.PropTypes.object,
  links: React.PropTypes.array,
};

export default DraggedNodeLinksLayer;
