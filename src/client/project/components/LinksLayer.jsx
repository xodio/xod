import React from 'react';
import SVGLayer from './SVGLayer';
import Link from './Link';
import { LAYER } from '../constants';

const LinksLayer = ({ links, onClick }) => (
  <SVGLayer
    name={LAYER.LINKS}
    className="LinksLayer"
  >
    {links.map(link =>
      <Link
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
