import React from 'react';
import R from 'ramda';
import Stylizer from '../utils/stylizer.js'

class Link extends React.Component {
    constructor(props) {
        super(props);
        this.displayName = 'Link';
        this.elId = 'link_' + this.props.link.id;

        this.state = {
          hovered: false
        };

        Stylizer.assignStyles(this, this.props.style);
        Stylizer.hoverable(this, ['line', 'helper']);
    }

    getPosition() {
      return {
        from: this.props.viewState.from.getAbsCenter(),
        to: this.props.viewState.to.getAbsCenter()
      };
    }

    getCoords() {
      const pos = this.getPosition();

      return {
        x1: pos.from.x,
        y1: pos.from.y,
        x2: pos.to.x,
        y2: pos.to.y
      };
    }

    render() {
      const coords = this.getCoords();
      const styles = this.getStyle();

      return (
        <g className="link" id={this.elId} onMouseOver={this.handleOver} onMouseOut={this.handleOut}>
          <line 
            {...coords}
            style={styles.helper} />
          <line 
            {...coords}
            style={styles.line} />
        </g>
      );
    }
}

export default Link;
