import React from 'react';
import normalizeWheel from 'normalize-wheel';
import PropTypes from 'prop-types';

import ReactResizeDetector from 'react-resize-detector';

class TabsContainer extends React.Component {
  constructor(props) {
    super(props);

    this.isOverflowed = false;
    this.domElement = null;

    this.setRef = this.setRef.bind(this);
    this.checkOverflow = this.checkOverflow.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
    this.checkOverflow();
  }

  componentDidUpdate() {
    this.checkOverflow();
  }

  setRef(domElement) {
    this.domElement = domElement;
    this.props.forwardedRef(domElement);
  }

  checkOverflow() {
    if (!this.domElement) return;

    const isOverflowed =
      this.domElement.scrollWidth > this.domElement.clientWidth;

    if (isOverflowed !== this.isOverflowed) {
      this.isOverflowed = isOverflowed;
      this.props.onOverflowChange(isOverflowed);
    }
  }

  handleScroll(event) {
    const normalizedWheel = normalizeWheel(event);

    if (normalizedWheel.pixelX === 0) {
      this.domElement.scrollLeft += normalizedWheel.pixelY;
    }
  }

  render() {
    return (
      <ul
        ref={this.setRef}
        className="TabsContainer"
        onWheel={this.handleScroll}
      >
        {this.props.children}
        <ReactResizeDetector
          handleWidth
          handleHeight
          onResize={this.checkOverflow}
        />
      </ul>
    );
  }
}

TabsContainer.propTypes = {
  forwardedRef: PropTypes.func.isRequired,
  onOverflowChange: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]),
};

export default TabsContainer;
