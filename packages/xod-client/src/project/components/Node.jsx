import R from 'ramda';
import React from 'react';
import classNames from 'classnames';

import PinLabel from './PinLabel';
import NodeText from './NodeText';
import { noop } from '../../utils/ramda';

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
      size,
      position,
      pins,
      outputPinsSectionHeight,
      label,
    } = this.props;

    const pinsArr = R.values(pins);

    const cls = classNames('Node', {
      'is-selected': this.props.isSelected,
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

    return (
      <svg
        key={this.id}
        className={cls}
        {...position}
        {...size}
        viewBox={`0 0 ${size.width} ${size.height}`}
        onMouseDown={this.onMouseDown}
      >
        <g>
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
          <rect
            className="outline"
            {...bodyRectProps}
          />
          <NodeText>
            {label}
          </NodeText>
        </g>
        <g className="pinlist">
          {pinsArr.map(pin =>
            <PinLabel
              keyName={pin.key}
              {...pin}
              key={`pinlabel_${pin.key}`}
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
  pins: React.PropTypes.any.isRequired,
  size: React.PropTypes.any.isRequired,
  outputPinsSectionHeight: React.PropTypes.number.isRequired,
  position: React.PropTypes.object.isRequired,
  isSelected: React.PropTypes.bool,
  isGhost: React.PropTypes.bool,
  onMouseDown: React.PropTypes.func,
};
Node.defaultProps = {
  isSelected: false,
  isGhost: false,
  onMouseDown: noop,
};

export default Node;
