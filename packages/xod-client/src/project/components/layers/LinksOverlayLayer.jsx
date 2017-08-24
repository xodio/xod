import React from 'react';
import PropTypes from 'prop-types';
import { LAYER } from '../../../editor/constants';

import SVGLayer from './SVGLayer';
import XODLink from '../Link';

import { isLinkSelected } from '../../../editor/utils';

const LinksOverlayLayer = ({ links, selection, onClick }) => (
  <SVGLayer
    name={LAYER.LINKS}
    className="LinksOverlayLayer"
  >
    {links.map(link =>
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
    )}
  </SVGLayer>
);

LinksOverlayLayer.propTypes = {
  links: PropTypes.arrayOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.object),
  onClick: PropTypes.func,
};

export default LinksOverlayLayer;
