import React from 'react';
import { LAYER } from '../../editor/constants';

import SVGLayer from './SVGLayer';

import {
  SLOT_MARGIN,
  SLOT_SIZE,
  NODE_CORNER_RADIUS,
} from '../nodeLayout';

/* eslint-disable react/no-danger */
const slotPatternHtml = `
  <defs>
      <rect
        id="slot_shape"
        x="${SLOT_MARGIN.HORIZONTAL / 2}"
        y="${SLOT_MARGIN.VERTICAL / 2}"
        width="${SLOT_SIZE.WIDTH}"
        height="${SLOT_SIZE.HEIGHT}"
        rx="${NODE_CORNER_RADIUS}" ry="${NODE_CORNER_RADIUS}"
      ></rect>
      <filter x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox" id="slot_inner_shadow">
          <!-- white shadow -->
          <feGaussianBlur stdDeviation="0.5" in="SourceAlpha" result="shadowBlurInner1"></feGaussianBlur>
          <feOffset dx="-1" dy="-1" in="shadowBlurInner1" result="shadowOffsetInner1"></feOffset>
          <feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"></feComposite>
          <feColorMatrix values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1  0 0 0 0.1 0" type="matrix" in="shadowInnerInner1" result="shadowMatrixInner1"></feColorMatrix>
          <!-- black shadow -->
          <feGaussianBlur stdDeviation="1" in="SourceAlpha" result="shadowBlurInner2"></feGaussianBlur>
          <feOffset dx="1.5" dy="1.5" in="shadowBlurInner2" result="shadowOffsetInner2"></feOffset>
          <feComposite in="shadowOffsetInner2" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner2"></feComposite>
          <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.1 0" type="matrix" in="shadowInnerInner2" result="shadowMatrixInner2"></feColorMatrix>
          <feMerge>
              <feMergeNode in="shadowMatrixInner1"></feMergeNode>
              <feMergeNode in="shadowMatrixInner2"></feMergeNode>
          </feMerge>
      </filter>
  </defs>
  <g stroke="none" fill="none">
      <use fill="#373737" fill-rule="evenodd" xlink:href="#slot_shape"></use>
      <use fill="black" fill-opacity="1" filter="url(#slot_inner_shadow)" xlink:href="#slot_shape"></use>
  </g>`;

const nodeSlotPattern = (
  <pattern
    id="patch_bg_pattern"
    width={SLOT_SIZE.WIDTH + SLOT_MARGIN.HORIZONTAL}
    height={SLOT_SIZE.HEIGHT + SLOT_MARGIN.VERTICAL}
    patternUnits="userSpaceOnUse"
    dangerouslySetInnerHTML={{ __html: slotPatternHtml }}
  />
);

const BackgroundLayer = ({ onClick }) => (
  <SVGLayer
    name={LAYER.BACKGROUND}
    className="BackgroundLayer"
  >
    {nodeSlotPattern}
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
