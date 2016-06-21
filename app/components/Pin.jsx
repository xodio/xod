import React from 'react'
import R from 'ramda'

class Pin extends React.Component {
    constructor(props) {
        super(props);

        this.displayName = 'Pin';
        this.elId = 'pin_' + props.data.id;

        this.state = {
          hovered: false
        };

        this.handleOver = this.onMouseOver.bind(this);
        this.handleOut = this.onMouseOut.bind(this);
    }
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

    getPosition() {
      const radius = this.props.style.radius;
      return {
        x: this.props.viewState.bbox.getPosition().x + radius + 1,
        y: this.props.viewState.bbox.getPosition().y + radius + 1
      };
    }
    getCircleProps() {
      return {
        cx: this.getPosition().x,
        cy: this.getPosition().y,
        r: this.props.style.radius
      };
    }
    getTextProps() {
      const textMargin = (this.props.style.radius + 2) * ((this.isInput()) ? 1 : -1);
      const pos = this.getPosition();
      return {
        x: pos.x + textMargin,
        y: pos.y + this.props.style.text.normal.fontSize / 4,
        transform: 'rotate(-90 '+(pos.x)+','+(pos.y)+')',
        textAnchor: (this.isInput()) ? 'start' : 'end'
      };
    }

    getType() {
      return this.props.data.type;
    }
    isInput() {
      return (this.getType() === 'input');
    }
    isOutput() {
      return (this.getType() === 'output');
    }

    render() {

      let styles = {
        circle: this.props.style.circle.normal,
        text: this.props.style.text.normal
      };

      if (this.state.hovered) {
        styles.circle = R.merge(styles.circle, this.props.style.circle.hover);
        styles.text = R.merge(styles.text, this.props.style.text.hover);
      }

      return (
        <g className="pin" id={this.elId} onMouseOver={this.handleOver} onMouseOut={this.handleOut}>
          <rect style={this.props.style.block} />
          <circle {...this.getCircleProps()} style={styles.circle} />
          <text className="test ad" {...this.getTextProps()} style={styles.text} >{this.props.data.key}</text>
        </g>
      );
    }
}

export default Pin;