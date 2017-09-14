import React from 'react';
import PropTypes from 'prop-types';

import pureDeepEqual from '../../../utils/pureDeepEqual';
import { LAYER } from '../../../editor/constants';

import { isLinkSelected } from '../../../editor/utils';

import SVGLayer from './SVGLayer';
import XODLink from '../Link';

const LinksLayer = ({ links, selection }) => (
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
      />
    )}
  </SVGLayer>
);

LinksLayer.propTypes = {
  links: PropTypes.arrayOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.object),
};

export default pureDeepEqual(LinksLayer);
