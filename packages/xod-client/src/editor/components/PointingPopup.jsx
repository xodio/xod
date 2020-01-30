import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import CustomScroll from 'react-custom-scroll';

import CloseButton from '../../core/components/CloseButton';

// Element that PoitingPopup points at might be visible partially
// in the container. `allowedOffset` is an amount of pixels that
// might be hidden outside the viewbox of the container.
const ALLOWED_OFFSET = 5;

const getRelativeOffsetTop = (containerEl, el, offset = 0) => {
  if (el === containerEl) return offset;
  if (el.tagName === 'BODY') return 0;
  const nextOffset = offset + el.offsetTop;
  return getRelativeOffsetTop(containerEl, el.offsetParent, nextOffset);
};

const calculatePointingPopupPosition = (container, item) => {
  const { offsetHeight, scrollTop } = container;
  const containerBottom = scrollTop + offsetHeight;

  const elHeight = item.offsetHeight;
  const elTop = getRelativeOffsetTop(container, item);
  const elBottom = elHeight + elTop;

  const viewBoxTop = scrollTop - ALLOWED_OFFSET;
  const viewBoxBottom = containerBottom + ALLOWED_OFFSET;

  const elVisible = elBottom <= viewBoxBottom && elTop >= viewBoxTop;
  const elBox = item.getClientRects()[0];

  return {
    isVisible: elVisible,
    top: Math.ceil(elBox.top),
    left: Math.ceil(elBox.left),
    right: Math.ceil(elBox.right),
  };
};

class PointingPopup extends React.Component {
  constructor(props) {
    super(props);

    this.ref = null;

    this.timer = null;
    this.state = {
      prevPosition: {},
      isVisible: true,
      top: 0,
      left: 0,
      pointerTop: 0,
      width: 0,
      height: 0,
      rightSided: false,
    };

    this.updateRef = this.updateRef.bind(this);
    this.getOffset = this.getOffset.bind(this);
    this.getPointerOffset = this.getPointerOffset.bind(this);

    this.onUpdatePosition = this.onUpdatePosition.bind(this);
  }
  componentDidMount() {
    this.onUpdatePosition();
    this.timer = setInterval(() => this.onUpdatePosition(), 5);
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.isVisible && !this.state.isVisible) {
      this.props.hidePopup();
      return;
    }
    if (
      this.ref &&
      (prevState.height !== this.ref.clientHeight ||
        prevState.width !== this.ref.clientWidth)
    ) {
      this.onUpdatePosition();
    }
  }
  componentWillUnmount() {
    clearInterval(this.timer);
    this.timer = null;
    this.props.hidePopup();
  }
  onUpdatePosition() {
    if (!this.ref || !this.props.isVisible) return;
    const item = document.querySelector(this.props.selectorPointingAt);
    if (!item) return;
    const container = item.closest('.inner-container');
    const position = calculatePointingPopupPosition(container, item);
    if (R.equals(this.state.prevPosition, position)) return;

    // If popup refers to an element that is too close to the right side and
    // popup could not fit window, it will be switched to the "rightSide"
    // mode. That also means the pointer will be translated to the right side
    // and popup will be positioned at the left side of referred element E.g.
    //
    // ProjectBrowser at the left side — PointingPopup is not "rightSided" popup;
    // ProjectBrowser at the right side — PointingPopup "rightSided".
    //
    // Also if the popup is too wide to fit either side, a jut would be
    // applied so that it will be completely visible at the expense of
    // overlaping the referred element.
    const windowWidth = window.innerWidth;
    const elWidth = this.ref.clientWidth;
    const overflow = Math.max(0, position.right + elWidth - windowWidth);
    const underflow = Math.max(0, elWidth - position.left);
    const rightSided = overflow > underflow;
    const jut = rightSided ? underflow : -overflow;
    const left = jut + (rightSided ? position.left - elWidth : position.right);

    const top = position.top;
    const windowHeight = window.innerHeight;
    const elHeight = this.ref.clientHeight;
    const isFitWindow = top + elHeight < windowHeight;
    const newTop = isFitWindow ? top : windowHeight - elHeight;
    const newPointer = isFitWindow ? 0 : top - newTop;

    this.setState({
      prevPosition: position,
      isVisible: position.isVisible,
      left,
      top: newTop,
      pointerTop: newPointer,
      height: elHeight,
      width: elWidth,
      rightSided,
    });
  }
  getOffset() {
    return {
      transform: `translate(${this.state.left}px, ${this.state.top}px)`,
    };
  }
  getPointerOffset() {
    return { transform: `translateY(${this.state.pointerTop}px)` };
  }
  updateRef(el) {
    this.ref = el;
  }
  render() {
    const { isVisible } = this.props;
    if (!isVisible) return null;
    const isHidden =
      !isVisible || !this.state.isVisible || this.state.top === 0;

    const cls = cn('PointingPopup', this.props.className, {
      'PointingPopup--hidden': isHidden,
      'PointingPopup--rightSided': this.state.rightSided,
    });

    return (
      <div className={cls} style={this.getOffset()} ref={this.updateRef}>
        <div className="pointer" style={this.getPointerOffset()} />
        <CloseButton tabIndex="0" onClick={this.props.hidePopup} />
        <div className="PointingPopup-content">
          <CustomScroll flex="1">{this.props.children}</CustomScroll>
        </div>
      </div>
    );
  }
}

PointingPopup.propTypes = {
  className: PropTypes.string,
  isVisible: PropTypes.bool.isRequired,
  children: PropTypes.node,
  selectorPointingAt: PropTypes.string,
  hidePopup: PropTypes.func.isRequired,
};

PointingPopup.defaultProps = {
  className: '',
  selectorPointingAt: null,
};

export default PointingPopup;
