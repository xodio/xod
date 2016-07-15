
import React from 'react';
import classNames from 'classnames';
import * as SIZES from '../constants/sizes';
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
    if (this.props.hoverable) {
      Stylizer.hoverable(this, ['line', 'helper']);
    }
    Stylizer.selectable(this, ['line']);

    this.onClick = this.onClick.bind(this);
  }

  onClick() {
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
    const cls = classNames('Link', {
      'is-selected': this.props.selected,
    });

    return (
      <g
        className={cls}
        id={this.elementId}
        onClick={this.onClick}
        onMouseOver={this.handleOver}
        onMouseOut={this.handleOut}
        pointerEvents={this.props.clickable}
      >
        <line
          stroke="transparent"
          strokeWidth={SIZES.LINK_HOTSPOT.width}
          {...coords}
        />
        <line
          className="line"
          {...coords}
        />
      </g>
    );
  }
}

Link.propTypes = {
  id: React.PropTypes.number.isRequired,
  from: React.PropTypes.object.isRequired,
  to: React.PropTypes.object.isRequired,
  selected: React.PropTypes.bool,
  hoverable: React.PropTypes.bool,
  clickable: React.PropTypes.bool,
  onClick: React.PropTypes.func.isRequired,
};

Link.defaultProps = {
  hoverable: true,
  clickable: true,
};

export default Link;
