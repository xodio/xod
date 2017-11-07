import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import pureDeepEqual from '../../../utils/pureDeepEqual';

import { isLinkSelected } from '../../../editor/utils';

import XODLink from '../Link';

const LinksLayer = ({ links, selection }) => (
  <g className="LinksLayer">
    {R.compose(
      R.map(link => (
        <XODLink
          key={link.id}
          id={link.id}
          from={link.from}
          to={link.to}
          type={link.type}
          dead={link.dead}
          isSelected={isLinkSelected(selection, link.id)}
        />
      )),
      R.values
    )(links)}
  </g>
);

LinksLayer.propTypes = {
  links: PropTypes.object,
  selection: PropTypes.arrayOf(PropTypes.object),
};

export default pureDeepEqual(LinksLayer);
