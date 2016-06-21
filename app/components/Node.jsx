import React from 'react'
import R from 'ramda'
import PinList from '../components/PinList.jsx'
import Stylizer from '../utils/stylizer.js'

class Node extends React.Component {
    constructor(props) {
        super(props);
        this.displayName = 'Node';
        this.node = this.props.node;
        this.elId = 'node_' + this.node.id;

        Stylizer.assignStyles(this, {
          block: this.props.style.node.block,
          rect: this.props.style.node.rect,
          text: this.props.style.node.text,
          pins: this.props.style.pin
        });
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
          <PinList pins={this.props.pins} viewState={this.props.viewState.pins} style={styles.pins} />
        </svg>
      );
    }
}

export default Node;
