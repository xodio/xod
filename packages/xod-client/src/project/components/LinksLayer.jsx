import React from 'react';
import { LAYER } from 'xod-core';

import SVGLayer from './SVGLayer';
import XODLink from './Link';

const LinksLayer = ({ links, onClick }) => (
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
        isSelected={link.isSelected}
        onClick={onClick}
      />
    )}
  </SVGLayer>
);

LinksLayer.propTypes = {
  links: React.PropTypes.arrayOf(React.PropTypes.object),
  onClick: React.PropTypes.func,
};

export default LinksLayer;
