import React from 'react';
import R from 'ramda';
import PinList from '../components/PinList.jsx';
import Stylizer from '../utils/stylizer.js';

const nodeStyles = {
  block: {
    fill: 'transparent'
  },
  rect: {
    normal: {
      fill: '#ccc',
      stroke: 'black',
      strokeWidth: 1,
    },
    hover: {
      fill: 'lightblue'
    }
  },
  text: {
    normal: {
      textAnchor: 'middle',
      aligmentBaseline: 'central',
      fill: 'black',
      fontSize: 12
    },
    hover: {
      fill: 'blue'
    }
  }
};

class Node extends React.Component {
    constructor(props) {
        super(props);
        this.node = this.props.node;
        this.elId = 'node_' + this.node.id;

        Stylizer.assignStyles(this, nodeStyles);
        Stylizer.hoverable(this, ['rect', 'text']);
    }

    getNodeStyle() {
      return this.props.style.node;
    }

    getPaddings() {
      return this.getNodeStyle().padding;
    }
    getRectProps() {
      const style = this.getNodeStyle();
      const paddings = this.getPaddings();
      return {
        width: style.width,
        height: style.height,
        x: paddings.x,
        y: paddings.y
      };
    }
    getBlockProps() {
      const paddings = this.getPaddings();
      return {
        x: 0,
        y: 0,
        width: this.getRectProps().width + (paddings.x * 2),
        height: this.getRectProps().height + (paddings.y * 2)
      };
    }
    getTextProps() {
      const rectSize = this.getRectProps();
      return {
        x: (rectSize.width / 2) + rectSize.x,
        y: (rectSize.height /2) + rectSize.y
      };
    }

    render() {
      const styles = this.getStyle();
      const position = this.props.viewState.nodes[this.node.id].bbox.getPosition();

      return (
        <svg {...position} key={this.elId} id={this.elId}>
          <g className="node" onMouseOver={this.handleOver} onMouseOut={this.handleOut}>
            <rect {...this.getRectProps()} style={styles.rect} />
            <text {...this.getTextProps()} style={styles.text}>{this.node.id}</text>
          </g>
          <PinList pins={this.props.pins} viewState={this.props.viewState.pins} radius={this.props.style.pin.radius} />
        </svg>
      );
    }
}

Node.propTypes = {
  node: React.PropTypes.any.isRequired,
  viewState: React.PropTypes.any.isRequired,
  radius: React.PropTypes.number.isRequired,
  size: React.PropTypes.any.isRequired,
};

export default Node;
