import React from 'react';
import Stylizer from '../utils/stylizer';
import * as PIN_TYPE from '../constants/pinType';

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

    this.onMouseUp = this.onMouseUp.bind(this);
  }

  onMouseUp() {
    this.props.onMouseUp(this.props.id);
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
    return (this.getType() === PIN_TYPE.INPUT);
  }
  isOutput() {
    return (this.getType() === PIN_TYPE.OUTPUT);
  }

  render() {
    const styles = this.getStyle();

    return (
      <g
        className="pin"
        id={this.elementId}
        onMouseUp={this.onMouseUp}
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
          {this.props.label}
        </text>
      </g>
    );
  }
}

Pin.propTypes = {
  id: React.PropTypes.number.isRequired,
  label: React.PropTypes.string.isRequired,
  type: React.PropTypes.number.isRequired,
  bbox: React.PropTypes.object.isRequired,
  radius: React.PropTypes.number.isRequired,
  onMouseUp: React.PropTypes.func.isRequired,
};
