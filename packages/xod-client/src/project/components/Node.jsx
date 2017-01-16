import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import { SIZE } from 'xod-core';

import Pin from './Pin';
import NodeText from './NodeText';
import { noop } from '../../utils/ramda';

class Node extends React.Component {
  constructor(props) {
    super(props);
    this.id = this.props.id;

    this.pins = {};

    this.pinListRef = null;
    this.testRef = null;

    this.width = this.props.width;
    this.originalWidth = this.props.width;
    this.height = this.props.height;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onPinMouseUp = this.onPinMouseUp.bind(this);
    this.onPinMouseDown = this.onPinMouseDown.bind(this);
  }

  componentDidMount() {
    this.updateNodeWidth();
  }

  shouldComponentUpdate(newProps) {
    return R.not(R.equals(newProps, this.props));
  }

  componentDidUpdate() {
    this.updateNodeWidth();
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

  getOriginPosition() {
    const position = R.clone(this.props.position);

    position.x -= SIZE.NODE.padding.x + (this.width / 2);
    position.y -= SIZE.NODE.padding.y + (this.height / 2);

    return position;
  }

  getRectProps() {
    return {
      width: this.width,
      height: this.height,
      x: SIZE.NODE.padding.x,
      y: SIZE.NODE.padding.y,
    };
  }

  getBlockProps() {
    return {
      x: 0,
      y: 0,
      width: this.getRectProps().width + (SIZE.NODE.padding.x * 2),
      height: this.getRectProps().height + (SIZE.NODE.padding.y * 2),
    };
  }

  getTextProps() {
    const rectSize = this.getRectProps();
    return {
      x: rectSize.x + (rectSize.width / 2),
      y: rectSize.y + (rectSize.height / 2),
    };
  }

  updateNodeWidth() {
    const nodeText = this.textRef;
    const textWidth = nodeText.getWidth();
    let newWidth = textWidth + (SIZE.NODE_TEXT.margin.x * 2);

    if (newWidth < SIZE.NODE.minWidth) {
      newWidth = SIZE.NODE.minWidth;
    }
    if (this.width !== newWidth && newWidth >= this.originalWidth) {
      this.width = newWidth;
      this.forceUpdate();
    }
  }

  render() {
    const assignTextRef = (ref) => { this.textRef = ref; };
    const assignPinListRef = (ref) => { this.pinListRef = ref; };

    const position = this.getOriginPosition();
    const pins = R.pipe(
      R.values,
      R.map(pin =>
        R.assoc('position', {
          x: pin.position.x - position.x,
          y: pin.position.y - position.y,
        }, pin)
      )
    )(this.props.pins);
    const textPosition = this.getTextProps();

    const cls = classNames('Node', {
      'is-selected': this.props.isSelected,
      'is-ghost': this.props.isGhost,
    });

    return (
      <svg
        className={cls}
        {...position}
        key={this.id}
        onMouseDown={this.onMouseDown}
      >
        <g
          onMouseOver={this.handleOver}
          onMouseOut={this.handleOut}
        >
          <rect className="body" {...this.getRectProps()} />
          <NodeText
            ref={assignTextRef}
            position={textPosition}
            label={this.props.label}
          />
        </g>
        <g className="pinlist" ref={assignPinListRef}>
          {pins.map(pin =>
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
  position: React.PropTypes.object.isRequired,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  isSelected: React.PropTypes.bool,
  isGhost: React.PropTypes.bool,
  onMouseDown: React.PropTypes.func,
  onPinMouseUp: React.PropTypes.func,
  onPinMouseDown: React.PropTypes.func,
};
Node.defaultProps = {
  width: SIZE.NODE.minWidth,
  height: SIZE.NODE.minHeight,
  isSelected: false,
  isGhost: false,
  onMouseDown: noop,
  onPinMouseUp: noop,
  onPinMouseDown: noop,
};

export default Node;
