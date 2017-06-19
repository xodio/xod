import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import { getBaseName } from 'xod-project';

import Pin from './Pin';
import PinLabel from './PinLabel';
import NodeText from './NodeText';
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
      outputPinsSectionHeight,
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

    const maskId = `${this.id}mask`;
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
        <g className={cls} onMouseDown={this.onMouseDown}>
          <clipPath id={maskId}>
            <rect
              className="mask"
              {...bodyRectProps}
            />
          </clipPath>
          <rect
            className="body"
            clipPath={`url(#${maskId})`}
          />
          <rect
            className="outputPinsSection"
            clipPath={`url(#${maskId})`}
            x="0"
            y={size.height - outputPinsSectionHeight}
            width="100%"
            height={outputPinsSectionHeight}
          />
          <NodeText>
            {nodeLabel}
          </NodeText>
          {pinsArr.map(pin =>
            <PinLabel
              {...pin}
              keyName={pin.key}
              key={`pinlabel_${pin.key}`}
            />
          )}
          <rect
            className="outline"
            {...bodyRectProps}
          />
        </g>
        <g className="pins">
          {pinsArr.map(pin =>
            <Pin
              {...pin}
              isSelected={isPinSelected(linkingPin, pin)}
              isAcceptingLinks={this.props.pinLinkabilityValidator(pin)}
              keyName={pin.key}
              key={`pin_${pin.key}`}
            />
          )}
        </g>
      </svg>
    );
  }
}

Node.propTypes = {
  id: React.PropTypes.string.isRequired,
  label: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  pins: React.PropTypes.any.isRequired,
  size: React.PropTypes.any.isRequired,
  outputPinsSectionHeight: React.PropTypes.number.isRequired,
  position: React.PropTypes.object.isRequired,
  isSelected: React.PropTypes.bool,
  isGhost: React.PropTypes.bool,
  isDragged: React.PropTypes.bool,
  hidden: React.PropTypes.bool,
  linkingPin: React.PropTypes.object,
  pinLinkabilityValidator: React.PropTypes.func,
  onMouseDown: React.PropTypes.func,
};

Node.defaultProps = {
  isSelected: false,
  isGhost: false,
  isDragged: false,
  onMouseDown: noop,
  pinLinkabilityValidator: R.F,
};

export default Node;
