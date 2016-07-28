import React from 'react';
import SVGLayer from './SVGLayer';
import Link from './Link';
import { LINKS as LAYER_NAME } from '../constants/layers';

const Links = ({ links, onClick }) => (
  <SVGLayer name={LAYER_NAME}>
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

Links.propTypes = {
  links: React.PropTypes.arrayOf(React.PropTypes.object),
  onClick: React.PropTypes.func,
};

export default Links;
