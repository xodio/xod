import React from 'react';
import R from 'ramda';

class SVGDraggable extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.getInitialState();

    this.handleDragStart = this.dragStart.bind(this);
    this.handleDragMove = this.dragMove.bind(this);
    this.handleDragStop = this.dragStop.bind(this);

    // console.log('!', this.state.initialPosition);
  }

  getInitialState() {
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
    };

    return state;
  }

  getInitialStateChild(el) {
    return {
      element: el,
      x: el.props.x,
      y: el.props.y,
    };
  }
  parseChildren() {
    let arr = [];
    if ({}.hasOwnProperty.call(this.props.children, 'length')) {
      arr = R.map(this.getInitialStateChild, this.props.children);
    }

    arr.push(this.getInitialStateChild(this.props.children));

    return arr;
  }

  dragStart(event) {
    this.state.startPosition = {
      x: event.clientX,
      y: event.clientY,
    };
    this.state.dragged = true;
    console.log('start!', this.state);
  }
  dragMove() {
    if (this.state.dragged) {
      // console.log('move!', arguments);
    }
  }
  dragStop() {
    this.state = this.getInitialState();
    console.log('stop!', this.state);
  }

  render() {
    return (
      <g
        onMouseDown={this.handleDragStart}
        onMouseMove={this.handleDragMove}
        onMouseUp={this.handleDragStop}
      >
        {this.props.children}
      </g>
    );
  }
}

SVGDraggable.propTypes = {
  children: React.PropTypes.any,
  onStart: React.PropTypes.any,
  onDrag: React.PropTypes.any,
  onStop: React.PropTypes.any,
};

export default SVGDraggable;
