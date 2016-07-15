
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
    this.updatePatchViewstate();
  }
  componentDidUpdate() {
    this.updatePatchViewstate();
  }

  onMouseUp() {
    if (this.props.isClicked && this.props.onMouseUp) {
      this.props.onMouseUp(this.id);
    }
  }
  onMouseDown(event) {
    if (this.props.draggable && this.props.onMouseDown) {
      this.props.onMouseDown(event, this.id);
    }
  }
  onPinMouseUp(pinId) {
    if (this.props.isClicked && this.props.onPinMouseUp) {
      this.props.onPinMouseUp(pinId);
    }
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

  updatePatchViewstate() {
    const nodeText = this.refs.text;

    const oldWidth = this.width;
    const textWidth = nodeText.getWidth();
    const newWidth = textWidth + (SIZES.NODE_TEXT.margin.x * 2);
    let resultWidth = oldWidth;

    if (oldWidth !== newWidth && newWidth > SIZES.NODE.minWidth) {
      resultWidth = newWidth;
    }

    const nodePins = R.pipe(
      R.values,
      R.map((pin) => {
        const position = {
          x: pin.position.x + this.getOriginPosition().x + SIZES.PIN.radius,
          y: pin.position.y + this.getOriginPosition().y + SIZES.PIN.radius,
        };
        return R.assoc('realPosition', position, pin);
      }),
      R.reduce((p, c) => R.assoc(c.id, c, p), {})
    )(this.props.pins);

    this.width = resultWidth;

    this.props.onRender(this.id, {
      width: resultWidth,
      pins: nodePins,
    });
  }

  render() {
    const pins = R.values(this.props.pins);
    const position = this.getOriginPosition();
    const textPosition = this.getTextProps();
    const draggable = this.props.draggable;

    const cls = classNames('Node', {
      'is-selected': this.props.selected
    });

    return (
      <svg
        className={cls}
        {...position}
        key={this.id}
        draggable={draggable}
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
  hoverable: React.PropTypes.bool,
  draggable: React.PropTypes.bool,
  isDragged: React.PropTypes.bool,
  isClicked: React.PropTypes.bool,
  onRender: React.PropTypes.func.isRequired,
  onMouseUp: React.PropTypes.func,
  onMouseDown: React.PropTypes.func,
  onPinMouseUp: React.PropTypes.func,
};
Node.defaultProps = {
  width: SIZES.NODE.minWidth,
  height: SIZES.NODE.minHeight,
  hoverable: true,
  draggable: true,
  isDragged: false,
  isClicked: false,
  selected: false,
};

export default Node;
