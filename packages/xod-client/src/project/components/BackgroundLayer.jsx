import React from 'react';
import SVGLayer from './SVGLayer';
import { LAYER } from 'xod-core';

const BackgroundLayer = ({ onClick }) => (
  <SVGLayer
    name={LAYER.BACKGROUND}
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
