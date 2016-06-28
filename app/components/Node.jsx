import R from 'ramda';
import React from 'react';
import Pin from '../components/Pin';
import Stylizer from '../utils/stylizer';

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
    this.elementId = `node_${this.id}`;

    Stylizer.assignStyles(this, nodeStyles);
    Stylizer.hoverable(this, ['rect', 'text']);
    Stylizer.selectable(this, ['rect']);

    this.onClick = this.onClick.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  onClick() {
    this.props.onClick(this.id);
  }
  onMouseDown(event) {
    if (this.props.draggable) {
      this.props.onMouseDown(event, this.id);
    }
  }

  getPaddings() {
    return this.props.padding;
  }
  getRectProps() {
    const size = this.props.bbox.getSize();
    const paddings = this.getPaddings();
    return {
      width: size.width,
      height: size.height,
      x: paddings.x,
      y: paddings.y,
    };
  }
  getBlockProps() {
    const paddings = this.getPaddings();
    return {
      x: 0,
      y: 0,
      width: this.getRectProps().width + (paddings.x * 2),
      height: this.getRectProps().height + (paddings.y * 2),
    };
  }
  getTextProps() {
    const rectSize = this.getRectProps();
    return {
      x: (rectSize.width / 2) + rectSize.x,
      y: (rectSize.height / 2) + rectSize.y + nodeStyles.text.normal.fontSize / 4,
    };
  }

  render() {
    const styles = this.getStyle();
    const pins = R.values(this.props.pins);
    const position = this.props.bbox.getPosition();
    const draggable = this.props.draggable;
    const dragStyle = {
      opacity: (this.props.isDragged) ? 0.7 : 1,
    };

    return (
      <svg
        className="node"
        {...position}
        id={this.elementId}
        key={this.elementId}
        draggable={draggable}
        onMouseDown={this.onMouseDown}
        style={dragStyle}
      >
        <g
          onMouseOver={this.handleOver}
          onMouseOut={this.handleOut}
          onClick={this.onClick}
        >
          <rect {...this.getRectProps()} style={styles.rect} />
          <text {...this.getTextProps()} style={styles.text}>{this.id}</text>
        </g>
        <g className="pinlist">
          {pins.map((pin) =>
            <Pin
              key={`pin_${pin.id}`}
              {...pin}
              radius={this.props.radius}
              onClick={this.props.onPinClick}
            />
          )}
        </g>
      </svg>
    );
  }
}

Node.propTypes = {
  id: React.PropTypes.number.isRequired,
  pins: React.PropTypes.any.isRequired,
  bbox: React.PropTypes.any.isRequired,
  padding: React.PropTypes.any.isRequired,
  radius: React.PropTypes.number.isRequired,
  draggable: React.PropTypes.bool.isRequired,
  isDragged: React.PropTypes.bool,
  onClick: React.PropTypes.func.isRequired,
  onMouseDown: React.PropTypes.func.isRequired,
  onPinClick: React.PropTypes.func.isRequired,
};

export default Node;
