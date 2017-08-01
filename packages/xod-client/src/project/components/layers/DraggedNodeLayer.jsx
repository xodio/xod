import React from 'react';
import PropTypes from 'prop-types';

import SVGLayer from './SVGLayer';
import Node from '../Node';

class DraggedNodeLayer extends React.PureComponent {
  render() {
    const {
      node,
      position,
      size,
    } = this.props;

    if (!node) return null;

    return (
      <SVGLayer
        name="DraggedNodeLayer"
        className="DraggedNodeLayer"
      >
        <Node
          key={`node_${node.id}`}
          id={node.id}
          label={node.label}
          type={node.type}
          position={position}
          size={size}
          outputPinsSectionHeight={node.outputPinsSectionHeight}
          pins={node.pins}
          isSelected
          isDragged
        />
      </SVGLayer>
    );
  }
}

DraggedNodeLayer.displayName = 'DraggedNodeLayer';

DraggedNodeLayer.propTypes = {
  node: PropTypes.any,
  position: PropTypes.any,
  size: PropTypes.any,
};

export default DraggedNodeLayer;
