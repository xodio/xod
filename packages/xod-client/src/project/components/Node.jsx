import R from 'ramda';
import React from 'react';
import classNames from 'classnames';

import Pin from './Pin';
import NodeText from './NodeText';
import { noop } from '../../utils/ramda';

import { NODE_CORNER_RADIUS } from '../nodeLayout';

class Node extends React.Component {
  constructor(props) {
    super(props);
    this.id = this.props.id;

    // needed for distinguishing between mouseDown events on pins and on node body
    this.pinListRef = null;

    this.assignPinListRef = this.assignPinListRef.bind(this);

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onPinMouseUp = this.onPinMouseUp.bind(this);
    this.onPinMouseDown = this.onPinMouseDown.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return R.not(R.equals(newProps, this.props));
  }

  onMouseDown(event) {
    if (this.pinListRef && this.pinListRef.contains(event.target)) {
      event.preventDefault();
      return;
    }

    this.props.onMouseDown(event, this.id);
  }

  onPinMouseUp(pinId) {
    this.props.onPinMouseUp(this.id, pinId);
  }

  onPinMouseDown(pinId) {
    this.props.onPinMouseDown(this.id, pinId);
  }

  assignPinListRef(ref) {
    this.pinListRef = ref;
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
        <g
          onMouseOver={this.handleOver}
          onMouseOut={this.handleOut}
        >
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
        <g className="pinlist" ref={this.assignPinListRef}>
          {pinsArr.map(pin =>
            <Pin
              keyName={pin.key}
              key={pin.key}
              {...pin}
              onMouseUp={this.onPinMouseUp}
              onMouseDown={this.onPinMouseDown}
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
  onPinMouseUp: React.PropTypes.func,
  onPinMouseDown: React.PropTypes.func,
};
Node.defaultProps = {
  isSelected: false,
  isGhost: false,
  onMouseDown: noop,
  onPinMouseUp: noop,
  onPinMouseDown: noop,
};

export default Node;
