import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { PIN_RADIUS, PIN_HIGHLIGHT_RADIUS } from '../nodeLayout';

import deepSCU from '../../utils/deepSCU';

export default class PinOverlay extends React.Component {
  constructor(props) {
    super(props);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);

    this.shouldComponentUpdate = deepSCU.bind(this);
  }

  onMouseUp(event) {
    this.props.onMouseUp(event, this.props.keyName);
  }

  onMouseDown(event) {
    this.props.onMouseDown(event, this.props.keyName);
  }

  render() {
    const cls = classNames('PinOverlay', {
      'is-selected': this.props.isSelected,
      'is-accepting-links': this.props.isAcceptingLinks,
    });

    const pinCircleCenter = {
      cx: this.props.position.x,
      cy: this.props.position.y,
    };

    return (
      <g
        className={cls}
        data-label={this.props.label} // for func tests
        onMouseUp={this.onMouseUp}
        onMouseDown={this.onMouseDown}
        onMouseOver={this.handleOver}
        onMouseOut={this.handleOut}
      >
        <circle
          className="linkingHighlight"
          {...pinCircleCenter}
          r={PIN_HIGHLIGHT_RADIUS}
        />
        <circle className="symbol" {...pinCircleCenter} r={PIN_RADIUS} />
      </g>
    );
  }
}

PinOverlay.propTypes = {
  keyName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  position: PropTypes.object.isRequired,
  onMouseUp: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  isAcceptingLinks: PropTypes.bool,
};
