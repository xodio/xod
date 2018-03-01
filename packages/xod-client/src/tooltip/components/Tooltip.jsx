import React from 'react';
import cn from 'classnames';

import {
  SHOW_GLOBAL_TOOLTIP,
  HIDE_GLOBAL_TOOLTIP,
} from '../events';

class Tooltip extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      shown: false,
      position: { x: -1000, y: -1000 },
      content: null,
    };

    this.timeout = 0;

    this.showTooltip = this.showTooltip.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
  }

  componentDidMount() {
    window.addEventListener(SHOW_GLOBAL_TOOLTIP, this.showTooltip);
    window.addEventListener(HIDE_GLOBAL_TOOLTIP, this.hideTooltip);
  }
  componentWillUnmount() {
    window.removeEventListener(SHOW_GLOBAL_TOOLTIP, this.showTooltip);
    window.removeEventListener(HIDE_GLOBAL_TOOLTIP, this.hideTooltip);
  }

  showTooltip(event) {
    this.setState({
      shown: true,
      position: event.detail.position,
      content: event.detail.content,
    });
  }

  hideTooltip() {
    this.setState({
      shown: false,
    });
  }

  render() {
    if (!this.state.content) return null;

    const cls = cn('Tooltip', {
      'is-visible': this.state.shown,
    });
    const { x: left, y: top } = this.state.position;

    return (
      <div
        className={cls}
        style={{ left, top }}
      >
        {this.state.content}
      </div>
    );
  }
}

Tooltip.propTypes = {};

export default Tooltip;
