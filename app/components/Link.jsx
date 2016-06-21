import React from 'react';
import R from 'ramda';

class Link extends React.Component {
    constructor(props) {
        super(props);
        this.displayName = 'Link';
        this.elId = 'link_' + this.props.link.id;

        this.state = {
          hovered: false
        };

        this.handleOver = this.onMouseOver.bind(this);
        this.handleOut = this.onMouseOut.bind(this);
    }

    getStyles() {
      const _styles = this.props.style;

      let styles = {
        line: _styles.line.normal,
        helper: _styles.helper.normal
      };

      if (this.state.hovered) {
        styles.line = R.merge(styles.line, _styles.line.hover);
        styles.helper = R.merge(styles.helper, _styles.helper.hover);
      }

      return styles;
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

    getPosition() {
      console.log('vs', this.props.viewState);
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
      const styles = this.getStyles();

      console.log('>',coords);

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
