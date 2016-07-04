import R from 'ramda';
import React from 'react';
import Pin from '../components/Pin';
import Stylizer from '../utils/stylizer';
import NodeText from '../components/NodeText';

import * as SIZES from '../constants/sizes';

const nodeStyles = {
  block: {
    fill: 'transparent',
  },
  rect: {
    normal: {
      fill: '#ccc',
      stroke: 'black',
      strokeWidth: 1,
    },
    hover: {
      fill: 'lightblue',
    },
    selected: {
      fill: 'yellow',
    },
  },
  text: {
    normal: {
      textAnchor: 'middle',
      aligmentBaseline: 'central',
      fill: 'black',
      fontSize: 12,
    },
    hover: {
      fill: 'blue',
    },
  },
};

class Node extends React.Component {
  constructor(props) {
    super(props);
    this.id = this.props.id;

    this.pins = {};

    Stylizer.assignStyles(this, nodeStyles);
    Stylizer.hoverable(this, ['rect', 'text']);
    Stylizer.selectable(this, ['rect']);

    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  componentDidMount() {
    this.updatePatchViewstate();
  }
  componentDidUpdate() {
    this.updatePatchViewstate();
  }

  onMouseUp() {
    if (this.props.isClicked) {
      this.props.onMouseUp(this.id);
    }
  }
  onMouseDown(event) {
    if (this.props.draggable) {
      this.props.onMouseDown(event, this.id);
    }
  }

  getZeroPosition() {
    const position = R.clone(this.props.position);

    position.x -= SIZES.NODE.padding.x + (this.props.width / 2);
    position.y -= SIZES.NODE.padding.y + (this.props.height / 2);

    return position;
  }
  getRectProps() {
    return {
      width: this.props.width,
      height: this.props.height,
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

    const oldWidth = this.props.width;
    const textWidth = nodeText.getWidth();
    const newWidth = textWidth + (SIZES.NODE_TEXT.margin.x * 2);
    let resultWidth = oldWidth;

    if (oldWidth !== newWidth && newWidth > SIZES.NODE.min_width) {
      resultWidth = newWidth;
    }

    const nodePins = R.pipe(
      R.values,
      R.map((pin) => {
        const n = pin;
        n.realPosition = {
          x: pin.position.x + this.getZeroPosition().x + SIZES.PIN.radius,
          y: pin.position.y + this.getZeroPosition().y + SIZES.PIN.radius,
        };
        return n;
      }),
      R.reduce((p, c) => {
        const n = p;
        n[c.id] = c;
        return n;
      }, {})
    )(this.props.pins);

    this.props.onRender(this.id, {
      width: resultWidth,
      pins: nodePins,
    });
  }

  render() {
    const styles = this.getStyle();
    const pins = R.values(this.props.pins);
    const position = this.getZeroPosition();
    const textPosition = this.getTextProps();

    const draggable = this.props.draggable;
    const dragStyle = {
      opacity: (this.props.isDragged) ? 0.7 : 1,
    };

    return (
      <svg
        className="node"
        {...position}
        key={this.id}
        draggable={draggable}
        onMouseDown={this.onMouseDown}
        style={dragStyle}
      >
        <g
          onMouseOver={this.handleOver}
          onMouseOut={this.handleOut}
          onMouseUp={this.onMouseUp}
        >
          <rect {...this.getRectProps()} style={styles.rect} ref="rect" />
          <NodeText
            ref="text"
            position={textPosition}
            style={styles.text}
            label={this.props.label}
          />
        </g>
        <g className="pinlist">
          {pins.map((pin) =>
            <Pin
              key={pin.id}
              {...pin}
              onMouseUp={this.props.onPinMouseUp}
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
  draggable: React.PropTypes.bool.isRequired,
  isDragged: React.PropTypes.bool,
  isClicked: React.PropTypes.bool,
  onRender: React.PropTypes.func.isRequired,
  onMouseUp: React.PropTypes.func.isRequired,
  onMouseDown: React.PropTypes.func.isRequired,
  onPinMouseUp: React.PropTypes.func.isRequired,
};
Node.defaultProps = {
  width: SIZES.NODE.min_width,
  height: SIZES.NODE.min_height,
  isDragged: false,
  isClicked: false,
};

export default Node;
