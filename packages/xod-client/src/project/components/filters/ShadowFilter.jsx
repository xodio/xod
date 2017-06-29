import React from 'react';
import PropTypes from 'prop-types';

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
  id: PropTypes.string.isRequired,
  dx: PropTypes.number.isRequired,
  dy: PropTypes.number.isRequired,
  deviation: PropTypes.number.isRequired,
  slope: PropTypes.number,
};

export default ShadowFilter;
