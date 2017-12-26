import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { noop } from '../../utils/ramda';
import { PIN_RADIUS, LINK_HOTSPOT_SIZE } from '../nodeLayout';

class Link extends React.Component {
  constructor(props) {
    super(props);
    this.elementId = `link_${this.props.id}`;

    this.onClick = this.onClick.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return !R.eqBy(
      R.omit(['onClick']),
      newProps,
      this.props
    );
  }

  onClick(event) {
    this.props.onClick(event, this.props.id);
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
    const cls = classNames(this.props.type, {
      Link: !this.props.isOverlay,
      LinkOverlay: this.props.isOverlay,
      'is-selected': this.props.isSelected,
      'is-ghost': this.props.isGhost,
      'is-dead': this.props.dead,
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
          strokeWidth={LINK_HOTSPOT_SIZE.WIDTH}
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
  id: PropTypes.string.isRequired,
  from: PropTypes.object.isRequired,
  to: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  dead: PropTypes.bool,
  isSelected: PropTypes.bool,
  isGhost: PropTypes.bool,
  isOverlay: PropTypes.bool,
  onClick: PropTypes.func,
};

Link.defaultProps = {
  dead: false,
  isSelected: false,
  isGhost: false,
  isOverlay: false,
  onClick: noop,
};

export default Link;
