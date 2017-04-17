import React from 'react';

const ShadowFilter = ({ id, dx, dy, deviation, slope = 0.5 }) => (
  <filter id={id} width="150%" height="150%">
    <feGaussianBlur in="SourceAlpha" stdDeviation={deviation} />
    <feOffset dx={dx} dy={dy} result="offsetblur" />
    <feComponentTransfer>
      <feFuncA type="linear" slope={slope} />
    </feComponentTransfer>
    <feMerge>
      <feMergeNode />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);

ShadowFilter.displayName = 'ShadowFilter';

ShadowFilter.propTypes = {
  id: React.PropTypes.string.isRequired,
  dx: React.PropTypes.number.isRequired,
  dy: React.PropTypes.number.isRequired,
  deviation: React.PropTypes.number.isRequired,
  slope: React.PropTypes.number,
};

export default ShadowFilter;
