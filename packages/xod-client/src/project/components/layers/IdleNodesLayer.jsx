import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import pureDeepEqual from '../../../utils/pureDeepEqual';
import { LAYER } from '../../../editor/constants';

import { isNodeSelected } from '../../../editor/utils';
import { getPinLinkabilityValidator } from '../../utils';

import SVGLayer from './SVGLayer';
import Node from '../Node';

const IdleNodesLayer = ({
  nodes,
  selection,
  linkingPin,
  areDragged,
  onMouseDown,
}) => {
  const pinLinkabilityValidator = getPinLinkabilityValidator(linkingPin, nodes);

  return (
    <SVGLayer
      name={LAYER.NODES} // TODO: we can have multiple instances of this layer
      className="NodesLayer"
    >
      {R.compose(
        R.map(
          node =>
            <Node
              key={node.id}
              id={node.id}
              label={node.label}
              type={node.type}
              position={node.position}
              size={node.size}
              pins={node.pins}
              width={node.width}
              isSelected={isNodeSelected(selection, node.id)}
              isGhost={node.isGhost} // TODO: is this actually used?
              isDragged={areDragged}
              linkingPin={linkingPin}
              pinLinkabilityValidator={pinLinkabilityValidator}
              onMouseDown={onMouseDown}
            />
        ),
        R.values
      )(nodes)}
    </SVGLayer>
  );
};

IdleNodesLayer.defaultProps = {
  areDragged: false,
};

IdleNodesLayer.propTypes = {
  nodes: PropTypes.objectOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.object),
  linkingPin: PropTypes.object,
  areDragged: PropTypes.bool,
  onMouseDown: PropTypes.func,
};

export default pureDeepEqual(IdleNodesLayer);
