import React from 'react';
import PropTypes from 'prop-types';

import {
  emitShowTooltip,
  emitHideTooltip,
} from '../eventEmitters';

// Delay between `mouseenter` and showing tooltip
const SHOW_TOOLTIP_DELAY = 500;

class TooltipHOC extends React.Component {
  constructor(props) {
    super(props);

    this.shown = false;
    this.timeout = 0;
    this.mousePosition = { x: 0, y: 0 };

    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  componentDidUpdate() {
    if (this.shown) {
      this.hideTooltip();
    }
  }
  componentWillUnmount() {
    this.hideTooltip();
  }

  onMouseOver(event) {
    this.mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };

    this.showTooltip();
  }

  onMouseMove(event) {
    this.mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  onMouseLeave() {
    this.hideTooltip();
  }

  showTooltip() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(
      () => {
        this.shown = true;
        emitShowTooltip({
          position: this.mousePosition,
          content: this.props.content,
        });
      },
      SHOW_TOOLTIP_DELAY
    );
  }

  hideTooltip() {
    this.timeout = clearTimeout(this.timeout);
    emitHideTooltip();
    this.shown = false;
  }

  render() {
    return this.props.render(this.onMouseOver, this.onMouseMove, this.onMouseLeave);
  }
}

TooltipHOC.propTypes = {
  content: PropTypes.node.isRequired,
  render: PropTypes.func.isRequired,
};

export default TooltipHOC;
