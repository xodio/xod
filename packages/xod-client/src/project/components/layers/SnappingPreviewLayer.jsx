import React from 'react';
import PT from 'prop-types';

import { Position, Size } from 'xod-project';
import sanctuaryPropType from '../../../utils/sanctuaryPropType';

import SVGLayer from './SVGLayer';
import { NODE_CORNER_RADIUS } from '../../nodeLayout';

const SnappingPreviewLayer = ({
  previews,
}) => (
  <SVGLayer
    name="SnappingPreviewLayer"
    className="SnappingPreviewLayer"
  >
    {previews.map(({ position, size }, key) => (
      <rect
        key={key} // in this particular case it's okay to use index as key
        className="SnappingPreview"
        {...position}
        {...size}
        rx={NODE_CORNER_RADIUS}
        ry={NODE_CORNER_RADIUS}
      />
    ))}
  </SVGLayer>
);

SnappingPreviewLayer.displayName = 'SnappingPreviewLayer';

SnappingPreviewLayer.propTypes = {
  previews: PT.arrayOf(PT.shape({
    position: sanctuaryPropType(Position),
    size: sanctuaryPropType(Size),
  })),
};

export default SnappingPreviewLayer;
