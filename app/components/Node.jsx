import React from 'react'
import R from 'ramda'
import PinList from '../components/PinList.jsx'

class Node extends React.Component {
    constructor(props) {
        super(props);
        this.displayName = 'Node';
        this.node = this.props.node;
        this.elId = 'node_' + this.node.id;
        this.state = {
          hovered: false
        };

        this.handleOver = this.onMouseOver.bind(this);
        this.handleOut = this.onMouseOut.bind(this);
    }

    // @TODO: Use react-update for this mess:
    onMouseOver() {
      let state = this.state;
      state.hovered = true;

      this.setState(state);
    }
    onMouseOut() {
      let state = this.state;
      state.hovered = false;

      this.setState(state);
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
      const _styles = this.getNodeStyle();
      const position = this.props.viewState.nodes[this.node.id].bbox.getPosition();

      let styles = {
        block: _styles.block,
        rect: _styles.rect.normal,
        text: _styles.text.normal,
        pins: this.props.style.pin
      }

      if (this.state.hovered) {
        styles.rect = R.merge(styles.rect, _styles.rect.hover);
        styles.text = R.merge(styles.text, _styles.text.hover);
      }

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
