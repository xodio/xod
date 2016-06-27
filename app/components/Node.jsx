import React from 'react';
import PinList from '../components/PinList';
import Stylizer from '../utils/stylizer';
import SVGDraggable from '../components/SVGDraggable';

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

    this.handleDragMove = this.onDragMove.bind(this);
    this.handleDragEnd = this.onDragEnd.bind(this);
  }

  onDragMove(event, position) {
    this.props.onDragMove(this.id, position);
  }
  onDragEnd(event, position) {
    this.props.onDragEnd(this.id, position);
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
    const position = this.props.bbox.getPosition();
    const draggable = this.props.draggable;

    return (
      <SVGDraggable
        key={this.elementId}
        active={draggable}
        onDragMove={this.handleDragMove}
        onDragEnd={this.handleDragEnd}
      >
        <svg {...position} id={this.elementId}>
          <g className="node" onMouseOver={this.handleOver} onMouseOut={this.handleOut}>
            <rect {...this.getRectProps()} style={styles.rect} />
            <text {...this.getTextProps()} style={styles.text}>{this.id}</text>
          </g>
          <PinList
            pins={this.props.pins}
            radius={this.props.radius}
          />
        </svg>
      </SVGDraggable>
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
  onDragMove: React.PropTypes.func.isRequired,
  onDragEnd: React.PropTypes.func.isRequired,
};

export default Node;
