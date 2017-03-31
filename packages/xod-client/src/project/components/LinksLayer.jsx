import React from 'react';
import { LAYER } from '../../editor/constants';

import { isLinkSelected } from '../../editor/utils';

import SVGLayer from './SVGLayer';
import XODLink from './Link';

const LinksLayer = ({ links, selection, onClick }) => (
  <SVGLayer
    name={LAYER.LINKS}
    className="LinksLayer"
  >
    {links.map(link =>
      <XODLink
        key={link.id}
        id={link.id}
        from={link.from}
        to={link.to}
        type={link.type}
        isSelected={isLinkSelected(selection, link.id)}
        onClick={onClick}
      />
    )}
  </SVGLayer>
);

LinksLayer.propTypes = {
  links: React.PropTypes.arrayOf(React.PropTypes.object),
  selection: React.PropTypes.arrayOf(React.PropTypes.object),
  onClick: React.PropTypes.func,
};

export default LinksLayer;
