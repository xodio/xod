import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import pureDeepEqual from '../../../utils/pureDeepEqual';

import { isNodeSelected } from '../../../editor/utils';
import { getPinLinkabilityValidator } from '../../utils';

import Node from '../Node';

const NodesLayer = ({
  nodes,
  selection,
  linkingPin,
  areDragged,
  onMouseDown,
  onMouseUp,
}) => {
  const pinLinkabilityValidator = getPinLinkabilityValidator(linkingPin, nodes);

  return (
    <g className="NodesLayer" >
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
              onMouseUp={onMouseUp}
            />
        ),
        R.values
      )(nodes)}
    </g>
  );
};

NodesLayer.defaultProps = {
  areDragged: false,
};

NodesLayer.propTypes = {
  nodes: PropTypes.objectOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.object),
  linkingPin: PropTypes.object,
  areDragged: PropTypes.bool,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
};

export default pureDeepEqual(NodesLayer);
