import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';

import { NODE_CORNER_RADIUS } from '../../nodeLayout';
import NodeLabel from './NodeLabel';

const NODE_BODY_RECT_PROPS = {
  rx: NODE_CORNER_RADIUS,
  ry: NODE_CORNER_RADIUS,
  // size is set in root svg, let's occupy it all
  width: '100%',
  height: '100%',
};

const RegularNodeBody = props => (
  <g>
    <rect
      className="body"
      {...NODE_BODY_RECT_PROPS}
    />
    <NodeLabel
      text={props.label || XP.getBaseName(props.type)}
      width={props.size.width}
      height={props.size.height}
    />
    <rect
      className="outline"
      {...NODE_BODY_RECT_PROPS}
    />
  </g>
);

RegularNodeBody.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  size: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
};

export default RegularNodeBody;
