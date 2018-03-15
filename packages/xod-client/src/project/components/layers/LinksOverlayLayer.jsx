import * as R from 'ramda';
import cn from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import pureDeepEqual from '../../../utils/pureDeepEqual';

import XODLink from '../Link';

import { isLinkSelected } from '../../../editor/utils';

const LinksOverlayLayer = ({ links, selection, hidden, onClick }) => (
  <g className={cn('LinksOverlayLayer', { hidden })}>
    {R.compose(
      R.map(link => (
        <XODLink
          isOverlay
          key={link.id}
          id={link.id}
          from={link.from}
          to={link.to}
          type={link.type}
          dead={link.dead}
          errors={link.errors}
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
  hidden: PropTypes.bool,
  selection: PropTypes.arrayOf(PropTypes.object),
  onClick: PropTypes.func,
};

export default pureDeepEqual(LinksOverlayLayer);
