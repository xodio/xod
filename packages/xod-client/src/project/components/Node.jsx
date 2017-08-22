import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getBaseName } from 'xod-project';

import Pin from './Pin';
import PinLabel from './PinLabel';
import { noop } from '../../utils/ramda';
import { isPinSelected } from '../../editor/utils';

import { NODE_CORNER_RADIUS } from '../nodeLayout';

class Node extends React.Component {
  constructor(props) {
    super(props);
    this.id = this.props.id;
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return R.not(R.equals(newProps, this.props));
  }

  onMouseDown(event) {
    this.props.onMouseDown(event, this.id);
  }

  render() {
    const {
      label,
      linkingPin,
      pins,
      position,
      size,
      type,
    } = this.props;

    const pinsArr = R.values(pins);

    const cls = classNames('Node', {
      'is-selected': this.props.isSelected,
      'is-dragged': this.props.isDragged,
      'is-ghost': this.props.isGhost,
    });

    const bodyRectProps = {
      rx: NODE_CORNER_RADIUS,
      ry: NODE_CORNER_RADIUS,
      // size is set in root svg, let's occupy it all
      width: '100%',
      height: '100%',
    };

    const svgStyle = {
      overflow: 'visible',
      opacity: this.props.hidden ? 0 : 1, // setting visibility is breaking masks
    };

    const nodeLabel = label || getBaseName(type);

    return (
      <svg
        key={this.id}
        style={svgStyle}
        {...position}
        {...size}
        viewBox={`0 0 ${size.width} ${size.height}`}
      >
        <g
          className={cls}
          onMouseDown={this.onMouseDown}
          title={nodeLabel} // this is for func-tests
        >
          <rect
            className="body"
            {...bodyRectProps}
          />
          <foreignObject {...size}>
            <div className="nodeLabelContainer" xmlns="http://www.w3.org/1999/xhtml">
              <span className="nodeLabel">{nodeLabel}</span>
            </div>
          </foreignObject>
          <rect
            className="outline"
            {...bodyRectProps}
          />
          {!this.props.isDragged ? <title>{nodeLabel}</title> : null}
        </g>
        <g className="pins">
          {pinsArr.map(pin =>
            <g key={pin.key}>
              <PinLabel
                {...pin}
                keyName={pin.key}
                key={`pinlabel_${pin.key}`}
              />
              <Pin
                {...pin}
                isSelected={isPinSelected(linkingPin, pin)}
                isAcceptingLinks={this.props.pinLinkabilityValidator(pin)}
                keyName={pin.key}
                key={`pin_${pin.key}`}
              />
            </g>
          )}
        </g>
      </svg>
    );
  }
}

Node.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  pins: PropTypes.any.isRequired,
  size: PropTypes.any.isRequired,
  position: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  isGhost: PropTypes.bool,
  isDragged: PropTypes.bool,
  hidden: PropTypes.bool,
  linkingPin: PropTypes.object,
  pinLinkabilityValidator: PropTypes.func,
  onMouseDown: PropTypes.func,
};

Node.defaultProps = {
  isSelected: false,
  isGhost: false,
  isDragged: false,
  onMouseDown: noop,
  pinLinkabilityValidator: R.F,
};

export default Node;
