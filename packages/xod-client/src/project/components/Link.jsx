import React from 'react';
import classNames from 'classnames';
import { SIZE } from 'xod-core';

import { noop } from '../../utils/ramda';
import { PIN_RADIUS } from '../nodeLayout';

class Link extends React.Component {
  constructor(props) {
    super(props);
    this.elementId = `link_${this.props.id}`;

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
    const cls = classNames('Link', this.props.type, {
      'is-selected': this.props.isSelected,
      'is-ghost': this.props.isGhost,
    });

    const clickable = this.isClickable();
    const pointerEvents = (clickable) ? 'all' : 'none';

    const linkEndRadius = PIN_RADIUS - 3;

    return (
      <g
        className={cls}
        id={this.elementId}
        onClick={this.onClick}
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
        <circle
          className="end"
          cx={coords.x1}
          cy={coords.y1}
          r={linkEndRadius}
          fill="black"
        />
        <circle
          className="end"
          cx={coords.x2}
          cy={coords.y2}
          r={linkEndRadius}
          fill="black"
        />
      </g>
    );
  }
}

Link.propTypes = {
  id: React.PropTypes.string.isRequired,
  from: React.PropTypes.object.isRequired,
  to: React.PropTypes.object.isRequired,
  type: React.PropTypes.string.isRequired,
  isSelected: React.PropTypes.bool,
  isGhost: React.PropTypes.bool,
  onClick: React.PropTypes.func,
};

Link.defaultProps = {
  isSelected: false,
  isGhost: false,
  hoverable: true,
  onClick: noop,
};

export default Link;
