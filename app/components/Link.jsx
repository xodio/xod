import React from 'react';
import Stylizer from '../utils/stylizer';

const linkStyles = {
  line: {
    normal: {
      stroke: 'black',
      strokeWidth: 2,
    },
    hover: {
      stroke: 'red',
    },
    selected: {
      stroke: 'red',
    },
  },
  helper: {
    normal: {
      stroke: 'transparent',
      strokeWidth: 8,
    },
    hover: {
      stroke: 'yellow',
    },
  },
};

class Link extends React.Component {
  constructor(props) {
    super(props);
    this.elementId = `link_${this.props.id}`;

    this.state = {
      hovered: false,
    };

    Stylizer.assignStyles(this, linkStyles);
    Stylizer.hoverable(this, ['line', 'helper']);
    Stylizer.selectable(this, ['line']);

    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    console.log('!', this);
    this.props.onClick(this.props.id);
  }

  getPosition() {
    return {
      from: this.props.from,
      to: this.props.to,
    };
  }

  getCoords() {
    const pos = this.getPosition();

    return {
      x1: pos.from.x,
      y1: pos.from.y,
      x2: pos.to.x,
      y2: pos.to.y,
    };
  }

  render() {
    const coords = this.getCoords();
    const styles = this.getStyle();

    return (
      <g
        className="link"
        id={this.elementId}
        onClick={this.onClick}
        onMouseOver={this.handleOver}
        onMouseOut={this.handleOut}
      >
        <line
          {...coords}
          style={styles.helper}
        />
        <line
          {...coords}
          style={styles.line}
        />
      </g>
    );
  }
}

Link.propTypes = {
  id: React.PropTypes.number.isRequired,
  from: React.PropTypes.object.isRequired,
  to: React.PropTypes.object.isRequired,
  onClick: React.PropTypes.func.isRequired,
};

export default Link;
