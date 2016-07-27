import React from 'react';
import SVGLayer from './SVGLayer';
import { BACKGROUND as LAYER_NAME } from '../constants/layers';

const Background = ({ width, height, onClick }) => (
  <SVGLayer name={LAYER_NAME}>
    <rect
      className="layer-background"
      key="bg" x="0" y="0"
      width={width}
      height={height}
      onClick={onClick}
    />
  </SVGLayer>
);

Background.propTypes = {
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired,
  onClick: React.PropTypes.func,
};

export default Background;
