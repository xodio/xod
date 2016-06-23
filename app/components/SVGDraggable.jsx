import React from 'react';
import R from 'ramda';

class SVGDraggable extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.getDefaultState();

    this.handleDragStart = this.dragStart.bind(this);
    this.handleDragMove = this.dragMove.bind(this);
    this.handleDragStop = this.dragStop.bind(this);

    const nullFunc = () => null;

    this.callbacks = {
      onStart: this.props.onStart || nullFunc,
      onDrag: this.props.onDrag || nullFunc,
      onStop: this.props.onStop || nullFunc,
    };

    // console.log('!', this.state.initialPosition);
  }

  getDefaultState() {
    const state = {
      initialPosition: this.parseChildren(),
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
      x: el.props.x,
      y: el.props.y,
    };
  }

  parseChildren() {
    let arr = [];
    if ({}.hasOwnProperty.call(this.props.children, 'length')) {
      arr = R.map(this.getChildState, this.props.children);
    }

    arr.push(this.getChildState(this.props.children));

    return arr;
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

    this.callbacks.onStart.call(this, event);

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
  dragStop(event) {
    if (!this.props.active) return;

    this.applyTranslate();
    this.state = this.getDefaultState();

    this.callbacks.onStop.call(this, event);

    this.forceUpdate();
  }

  applyTranslate() {
    // @TODO: Apply translate to state!
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
        onMouseUp={this.handleDragStop}
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
  onStart: React.PropTypes.func,
  onDrag: React.PropTypes.func,
  onStop: React.PropTypes.func,
};

export default SVGDraggable;
