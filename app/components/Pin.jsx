import React from 'react';
import Stylizer from '../utils/stylizer';

const pinStyles = {
  block: {
    width: 15,
    height: 25,
    fill: 'transparent',
  },
  circle: {
    normal: {
      fill: 'darkgrey',
      stroke: 'black',
      strokeWidth: 1,
      cursor: 'default',
    },
    hover: {
      fill: 'red',
    },
    selected: {
      fill: 'yellow',
      stroke: 'red',
    },
  },
  text: {
    normal: {
      fill: 'black',
      fontSize: 12,
      aligmentBaseline: 'central',
      cursor: 'default',
    },
    hover: {
      fill: 'red',
    },
    selected: {
      fill: 'red',
    },
  },
};

export default class Pin extends React.Component {
  constructor(props) {
    super(props);

    this.elementId = `pin_${props.id}`;

    Stylizer.assignStyles(this, pinStyles);
    Stylizer.hoverable(this, ['circle', 'text']);
    Stylizer.selectable(this, ['circle', 'text']);

    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    this.props.onClick(this.props.id);
  }

  getPosition() {
    const radius = this.props.radius;
    return {
      x: this.props.bbox.getPosition().x + radius + 1,
      y: this.props.bbox.getPosition().y + radius + 1,
    };
  }
  getBlockCorrection() {
    return {
      x: (pinStyles.block.width / 2 - this.props.radius),
      y: (pinStyles.block.height),
    };
  }
  getRectProps() {
    const rp = {
      x: this.getPosition().x - (this.props.radius + this.getBlockCorrection().x),
      y: this.getPosition().y,
    };

    if (this.isInput()) {
      rp.y -= (pinStyles.block.height);
    }

    return rp;
  }
  getCircleProps() {
    return {
      cx: this.getPosition().x,
      cy: this.getPosition().y,
      r: this.props.radius,
    };
  }
  getTextProps() {
    const textMargin = (
      (this.props.radius + this.getBlockCorrection().x) * ((this.isInput()) ? 1 : -1)
    );
    const pos = this.getPosition();
    return {
      x: pos.x + textMargin,
      y: pos.y + this.getStyle().text.fontSize / 4,
      transform: `rotate(-90 ${pos.x}, ${pos.y})`,
      textAnchor: (this.isInput()) ? 'start' : 'end',
    };
  }

  getType() {
    return this.props.type;
  }
  isInput() {
    return (this.getType() === 'input');
  }
  isOutput() {
    return (this.getType() === 'output');
  }

  render() {
    const styles = this.getStyle();

    return (
      <g
        className="pin"
        id={this.elementId}
        onClick={this.onClick}
        onMouseOver={this.handleOver}
        onMouseOut={this.handleOut}
      >
        <rect {...this.getRectProps()} style={styles.block} />
        <circle {...this.getCircleProps()} style={styles.circle} />
        <text
          key={`pinText_${this.props.id}`}
          {...this.getTextProps()}
          style={styles.text}
        >
          {this.props.name}
        </text>
      </g>
    );
  }
}

Pin.propTypes = {
  id: React.PropTypes.number.isRequired,
  name: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  bbox: React.PropTypes.object.isRequired,
  radius: React.PropTypes.number.isRequired,
  onClick: React.PropTypes.func.isRequired,
};
