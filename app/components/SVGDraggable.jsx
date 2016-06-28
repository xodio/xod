import React from 'react';
import R from 'ramda';

class SVGDraggable extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.getDefaultState();

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    const nullFunc = f => f;

    this.callbacks = {
      onDragMove: this.props.onDragMove || nullFunc,
      onDragEnd: this.props.onDragEnd || nullFunc,
    };
  }

  onMouseDown(event) {
    if (!this.props.active) return;

    this.tempDragged = true;
    this.state.mousePrevPosition = {
      x: event.clientX,
      y: event.clientY,
    };
  }
  onMouseMove(event) {
    if (!this.props.active) return;

    if (this.tempDragged) {
      const mousePos = {
        x: event.clientX,
        y: event.clientY,
      };

      // Check for really dragging
      if (
        mousePos.x !== this.state.mousePrevPosition.x ||
        mousePos.y !== this.state.mousePrevPosition.y
      ) {
        // @TODO: Move component above all other components into this layer!
        const curPosition = this.getChildState(this.props.children).position;
        const newPos = {
          x: (mousePos.x - this.state.mousePrevPosition.x) + curPosition.x,
          y: (mousePos.y - this.state.mousePrevPosition.y) + curPosition.y,
        };

        this.state.dragged = true;
        this.callbacks.onDragMove(event, newPos);
        this.state.mousePrevPosition = {
          x: mousePos.x,
          y: mousePos.y,
        };
        this.forceUpdate();
      }
    }
  }
  onMouseUp(event) {
    if (!this.props.active) return;

    this.tempDragged = false;

    if (this.state.dragged) {
      const curPosition = this.getChildState(this.props.children).position;
      this.callbacks.onDragEnd(event, curPosition);
      this.state = this.getDefaultState();
    }
  }

  getDefaultState(newPosition) {
    const el = this.getChildState(this.props.children);
    const state = {
      element: el.element,
      position: newPosition || el.position,
      mousePrevPosition: {
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

  // @TODO: This crutch should be removed, because MouseMove event handling should be in the Patch!
  getDragMonitorProps() {
    return (this.state.dragged) ? {
      x: -500, y: -500,
      width: 2000, height: 2000,
      style: {
        fill: 'transparent',
      },
    } : {
      x: 0, y: 0,
      width: 0, height: 0,
      style: {
        fill: 'transparent',
      },
    };
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
    const dragMonitorProps = this.getDragMonitorProps();

    return (
      <g
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
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
  onDragMove: React.PropTypes.func,
  onDragEnd: React.PropTypes.func,
};

export default SVGDraggable;
