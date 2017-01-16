import React from 'react';
import classNames from 'classnames';
import { SIZE } from 'xod-core';

import Stylizer from '../../utils/stylizer';
import { noop } from '../../utils/ramda';

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

  isClickable() {
    return (!this.props.isGhost);
  }

  render() {
    const coords = this.getCoords();
    const cls = classNames('Link', {
      'is-selected': this.props.isSelected,
      'is-ghost': this.props.isGhost,
    });

    const clickable = this.isClickable();
    const pointerEvents = (clickable) ? 'all' : 'none';

    return (
      <g
        className={cls}
        id={this.elementId}
        onClick={this.onClick}
        onMouseOver={this.handleOver}
        onMouseOut={this.handleOut}
        style={{ pointerEvents }}
      >
        <line
          stroke="transparent"
          strokeWidth={SIZE.LINK_HOTSPOT.width}
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
  id: React.PropTypes.string.isRequired,
  from: React.PropTypes.object.isRequired,
  to: React.PropTypes.object.isRequired,
  isSelected: React.PropTypes.bool,
  isGhost: React.PropTypes.bool,
  hoverable: React.PropTypes.bool,
  onClick: React.PropTypes.func,
};

Link.defaultProps = {
  isSelected: false,
  isGhost: false,
  hoverable: true,
  onClick: noop,
};

export default Link;
