import React from 'react';
import PinList from '../components/PinList';
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
    this.node = this.props.node;
    this.elementId = `node_${this.node.id}`;

    Stylizer.assignStyles(this, nodeStyles);
    Stylizer.hoverable(this, ['rect', 'text']);
  }

  getViewState() {
    return this.props.viewState.nodes[this.node.id];
  }

  getPaddings() {
    return this.getViewState().padding;
  }
  getRectProps() {
    const size = this.getViewState().bbox.getSize();
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
    const position = this.getViewState().bbox.getPosition();

    return (
      <svg {...position} key={this.elementId} id={this.elementId}>
        <g className="node" onMouseOver={this.handleOver} onMouseOut={this.handleOut}>
          <rect {...this.getRectProps()} style={styles.rect} />
          <text {...this.getTextProps()} style={styles.text}>{this.node.id}</text>
        </g>
        <PinList
          pins={this.props.pins}
          viewState={this.props.viewState.pins}
          radius={this.props.radius}
        />
      </svg>
    );
  }
}

Node.propTypes = {
  node: React.PropTypes.any.isRequired,
  pins: React.PropTypes.any.isRequired,
  viewState: React.PropTypes.any.isRequired,
  radius: React.PropTypes.number.isRequired,
};

export default Node;
