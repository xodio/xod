
import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import Pin from '../components/Pin';
import NodeText from '../components/NodeText';

import * as SIZES from '../constants/sizes';

class Node extends React.Component {
  constructor(props) {
    super(props);
    this.id = this.props.id;

    this.pins = {};

    this.width = this.props.width;
    this.height = this.props.height;

    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onPinMouseUp = this.onPinMouseUp.bind(this);
  }

  componentDidMount() {
    this.updateNodeWidth();
  }

  shouldComponentUpdate(newProps) {
    return !R.equals(newProps, this.props);
  }

  onMouseUp() {
    this.props.onMouseUp(this.id);
  }

  onMouseDown(event) {
    this.props.onMouseDown(event, this.id);
  }

  onPinMouseUp(pinId) {
    this.props.onPinMouseUp(pinId);
  }

  getOriginPosition() {
    const position = R.clone(this.props.position);

    position.x -= SIZES.NODE.padding.x + (this.width / 2);
    position.y -= SIZES.NODE.padding.y + (this.height / 2);

    return position;
  }

  getRectProps() {
    return {
      width: this.width,
      height: this.height,
      x: SIZES.NODE.padding.x,
      y: SIZES.NODE.padding.y,
    };
  }

  getBlockProps() {
    return {
      x: 0,
      y: 0,
      width: this.getRectProps().width + (SIZES.NODE.padding.x * 2),
      height: this.getRectProps().height + (SIZES.NODE.padding.y * 2),
    };
  }

  getTextProps() {
    const rectSize = this.getRectProps();
    return {
      x: rectSize.x + rectSize.width / 2,
      y: rectSize.y + rectSize.height / 2,
    };
  }

  updateNodeWidth() {
    const nodeText = this.refs.text;
    const textWidth = nodeText.getWidth();
    let newWidth = textWidth + (SIZES.NODE_TEXT.margin.x * 2);

    if (newWidth < SIZES.NODE.minWidth) {
      newWidth = SIZES.NODE.minWidth;
    }
    if (this.width !== newWidth) {
      this.width = newWidth;
      this.forceUpdate();
    }
  }

  render() {
    const position = this.getOriginPosition();
    const pins = R.pipe(
      R.values,
      R.map((pin) => {
        const newPosition = {
          x: pin.position.x - position.x,
          y: pin.position.y - position.y,
        };
        return R.assoc('position', newPosition, pin);
      })
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
          onMouseUp={this.onMouseUp}
        >
          <rect className="body" {...this.getRectProps()} ref="rect" />
          <NodeText
            ref="text"
            position={textPosition}
            label={this.props.label}
          />
        </g>
        <g className="pinlist">
          {pins.map((pin) =>
            <Pin
              key={pin.id}
              {...pin}
              onMouseUp={this.onPinMouseUp}
            />
          )}
        </g>
      </svg>
    );
  }
}

Node.propTypes = {
  id: React.PropTypes.number.isRequired,
  label: React.PropTypes.string.isRequired,
  pins: React.PropTypes.any.isRequired,
  position: React.PropTypes.object.isRequired,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  isSelected: React.PropTypes.bool,
  isGhost: React.PropTypes.bool,
  onMouseUp: React.PropTypes.func,
  onMouseDown: React.PropTypes.func,
  onPinMouseUp: React.PropTypes.func,
};
Node.defaultProps = {
  width: SIZES.NODE.minWidth,
  height: SIZES.NODE.minHeight,
  isSelected: false,
  isGhost: false,
  onMouseUp: f => f,
  onMouseDown: f => f,
};

export default Node;
