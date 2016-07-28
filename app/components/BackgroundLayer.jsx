import React from 'react';
import SVGLayer from './SVGLayer';
import { BACKGROUND as LAYER_NAME } from '../constants/layers';

const BackgroundLayer = ({ width, height, onClick }) => (
  <SVGLayer
    name={LAYER_NAME}
    className="BackgroundLayer"
  >
    <rect
      className="BackgroundRect"
      key="bg" x="0" y="0"
      width={width}
      height={height}
      onClick={onClick}
    />
  </SVGLayer>
);

BackgroundLayer.propTypes = {
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired,
  onClick: React.PropTypes.func,
};

export default BackgroundLayer;
