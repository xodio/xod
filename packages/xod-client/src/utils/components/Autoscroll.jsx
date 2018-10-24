/*
  Edited fork of `autoscroll-react`: https://github.com/thk2b/autoscroll-react
  Changes:
  - Added `onScrolledFromBottom` property
  - Added `scrollDown` method
 */

import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

/* eslint-disable no-param-reassign */
const hasOverflow = el => el.clientHeight < el.scrollHeight;
const isScrolledDown = (el, threshold) => {
  const bottom = el.scrollTop + el.clientHeight;
  return bottom >= el.scrollHeight - threshold;
};
const isScrolledUp = el => el.scrollTop === 0;
const scrollDown = el => (el.scrollTop = el.scrollHeight - el.clientHeight);
const scrollDownBy = (amount, el) => (el.scrollTop += amount);
/* eslint-enable no-param-reassign */

const isScrolledDownThreshold = 0;

class Autoscroll extends React.PureComponent {
  constructor(props) {
    super(props);
    this._isScrolledDown = true; /* whether the user has scrolled down */
    this._el = null;
    this._scrollHeight = null;
    this._isScrolledUp = null;
  }
  componentDidMount() {
    this.scrollDownIfNeeded();
  }
  componentWillUpdate() {
    this._scrollHeight = this._el.scrollHeight;
    this._isScrolledUp = isScrolledUp(this._el);
  }
  componentDidUpdate() {
    /* if the list is scrolled all the way up and new items are added, preserve the current scroll position */
    if (this._isScrolledUp && this._scrollHeight !== null) {
      /* the scroll height increased by this much during the update */
      const difference = this._el.scrollHeight - this._scrollHeight;
      this._scrollHeight = null;
      scrollDownBy(difference, this._el);
    } else this.scrollDownIfNeeded();
  }
  scrollDownIfNeeded() {
    if (this._isScrolledDown && hasOverflow(this._el)) {
      scrollDown(this._el);
    }
  }
  scrollDown() {
    scrollDown(this._el);
  }
  handleScroll(e) {
    const nextIsScrolledDown = isScrolledDown(
      this._el,
      isScrolledDownThreshold
    );
    if (
      !nextIsScrolledDown &&
      this._isScrolledDown &&
      this.props.onScrolledFromBottom
    ) {
      this.props.onScrolledFromBottom(e);
    }
    this._isScrolledDown = nextIsScrolledDown;

    if (isScrolledUp(this._el) && this.props.onScrolledTop) {
      this.props.onScrolledTop(e);
    }

    if (this.props.onScrolled) {
      this.props.onScrolled(e);
    }
  }
  render() {
    const restProps = R.omit(
      ['onScrolled', 'onScrolledTop', 'onScrolledFromBottom'],
      this.props
    );
    return (
      <div
        {...restProps}
        ref={el => (this._el = el)}
        onScroll={e => this.handleScroll(e)}
      />
    );
  }
}

Autoscroll.propTypes = {
  onScrolled: PropTypes.func,
  onScrolledTop: PropTypes.func,
  onScrolledFromBottom: PropTypes.func,
};

export default Autoscroll;
