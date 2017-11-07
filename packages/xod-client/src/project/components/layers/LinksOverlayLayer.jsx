import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import pureDeepEqual from '../../../utils/pureDeepEqual';

import XODLink from '../Link';

import { isLinkSelected } from '../../../editor/utils';

const LinksOverlayLayer = ({ links, selection, onClick }) => (
  <g className="LinksOverlayLayer">
    {R.compose(
      R.map(link => (
        <XODLink
          isOverlay
          key={link.id}
          id={link.id}
          from={link.from}
          to={link.to}
          type={link.type}
          onClick={onClick}
          isSelected={isLinkSelected(selection, link.id)}
        />
      )),
      R.values
    )(links)}
  </g>
);

LinksOverlayLayer.propTypes = {
  links: PropTypes.object,
  selection: PropTypes.arrayOf(PropTypes.object),
  onClick: PropTypes.func,
};

export default pureDeepEqual(LinksOverlayLayer);
