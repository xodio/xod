import React from 'react';
import SVGLayer from './SVGLayer';
import { BACKGROUND as LAYER_NAME } from '../constants/layers';

const BackgroundLayer = ({ onClick }) => (
  <SVGLayer
    name={LAYER_NAME}
    className="BackgroundLayer"
  >
    <rect
      className="BackgroundRect"
      key="bg" x="0" y="0"
      width="100%"
      height="100%"
      onClick={onClick}
    />
  </SVGLayer>
);

BackgroundLayer.propTypes = {
  onClick: React.PropTypes.func,
};

export default BackgroundLayer;
