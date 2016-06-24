import React from 'react';
import R from 'ramda';

class SVGDraggable extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.getDefaultState();

    this.handleDragStart = this.dragStart.bind(this);
    this.handleDragMove = this.dragMove.bind(this);
    this.handleDragEnd = this.dragEnd.bind(this);

    const nullFunc = f => f;

    this.callbacks = {
      onDragStart: this.props.onDragStart || nullFunc,
      onDrag: this.props.onDrag || nullFunc,
      onDragEnd: this.props.onDragEnd || nullFunc,
    };
  }

  getDefaultState(newPosition) {
    const el = this.getChildState(this.props.children);
    const state = {
      element: el.element,
      position: newPosition || el.position,
      translate: {
        x: 0,
        y: 0,
      },
      startPosition: {
        x: 0,
        y: 0,
      },
      dragged: false,
      scale: 1,
    };

    return state;
  }

  getChildState(el) {
    return {
      element: el,
      position: {
        x: el.props.x,
        y: el.props.y,
      },
    };
  }

  dragStart(event) {
    if (!this.props.active) return;
    // @TODO: Move component above all other components into this layer!
    this.state.startPosition = {
      x: event.clientX,
      y: event.clientY,
    };
    this.state.dragged = true;
    this.state.scale = 1.1;

    this.callbacks.onDragStart.call(this, event);

    this.forceUpdate();
  }
  dragMove(event) {
    if (!this.props.active) return;

    if (this.state.dragged) {
      const mousePos = {
        x: event.clientX,
        y: event.clientY,
      };

      this.state.translate = {
        x: mousePos.x - this.state.startPosition.x,
        y: mousePos.y - this.state.startPosition.y,
      };
    }

    this.callbacks.onDrag.call(this, event);

    this.forceUpdate();
  }
  dragEnd(event) {
    if (!this.props.active) return;

    const newPosition = this.applyTranslate();

    this.callbacks.onDragEnd(event, newPosition);
    this.state = this.getDefaultState(newPosition);

    this.forceUpdate();
  }

  applyTranslate() {
    const newPosition = R.clone(this.state.position);

    newPosition.x += this.state.translate.x;
    newPosition.y += this.state.translate.y;

    return newPosition;
  }

  render() {
    const styles = {
      opacity: (this.state.dragged) ? 0.6 : 1,
    };
    // @TODO: make a candy from this crap:
    const dragMonitorProps = (this.state.dragged) ? {
      x: -500,
      y: -500,
      width: 2000,
      height: 2000,
      style: {
        fill: 'transparent',
      },
    } : {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      style: {
        fill: 'transparent',
      },
    };

    return (
      <g
        onMouseDown={this.handleDragStart}
        onMouseMove={this.handleDragMove}
        onMouseUp={this.handleDragEnd}
        transform={`translate(${this.state.translate.x} ${this.state.translate.y})`}
        style={styles}
      >
        {this.props.children}
        <rect {...dragMonitorProps} />
      </g>
    );
  }
}

SVGDraggable.propTypes = {
  children: React.PropTypes.any,
  active: React.PropTypes.bool,
  onDragStart: React.PropTypes.func,
  onDrag: React.PropTypes.func,
  onDragEnd: React.PropTypes.func,
};

export default SVGDraggable;
