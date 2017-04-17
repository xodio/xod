import React from 'react';

import ShadowFilter from './ShadowFilter';

const PinShadowFilter = () => (
  <ShadowFilter
    id="pinShadow"
    dx={1}
    dy={1}
    deviation={1}
    slope={0.5}
  />
);

export default PinShadowFilter;
