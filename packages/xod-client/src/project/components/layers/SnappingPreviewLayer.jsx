import React from 'react';

import { Position, Size } from 'xod-project';
import sanctuaryPropType from '../../../utils/sanctuaryPropType';

import SVGLayer from './SVGLayer';
import {
  snapNodePositionToSlots,
  snapNodeSizeToSlots,
  NODE_CORNER_RADIUS,
} from '../../nodeLayout';

const SnappingPreviewLayer = ({
  draggedEntityPosition,
  draggedEntitySize,
}) => (
  <SVGLayer
    name="SnappingPreviewLayer"
    className="SnappingPreviewLayer"
  >
    <rect
      className="SnappingPreview"
      {...snapNodePositionToSlots(draggedEntityPosition)}
      {...snapNodeSizeToSlots(draggedEntitySize)}
      rx={NODE_CORNER_RADIUS}
      ry={NODE_CORNER_RADIUS}
    />
  </SVGLayer>
);

SnappingPreviewLayer.displayName = 'SnappingPreviewLayer';

SnappingPreviewLayer.propTypes = {
  draggedEntityPosition: sanctuaryPropType(Position),
  draggedEntitySize: sanctuaryPropType(Size),
};

export default SnappingPreviewLayer;
