import React from 'react';
import PropTypes from 'prop-types';
import CustomScroll from 'react-custom-scroll';

class SuggesterContainer extends React.Component {
  constructor(props) {
    super(props);
    this.scrollRef = null;

    this.moveTimes = 0;
    this.moveTimeout = null;

    this.state = {
      scrollPos: undefined,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const newPos = this.getScrollPosition();

    if (newPos === prevState.scrollPos) return;
    this.updateScrollPosition(newPos);
  }

  setScrollRef = (el) => {
    this.scrollRef = el;
  };

  getScrollPosition = () => {
    if (this.scrollRef) {
      const contentWrapper = this.scrollRef.refs.contentWrapper;

      const highlighted = contentWrapper.getElementsByClassName('is-highlighted');
      if (highlighted.length > 0) {
        const top = highlighted[0].offsetTop;
        const height = highlighted[0].clientHeight;
        const containerHeight = contentWrapper.clientHeight;
        const scrollPos = this.scrollRef.state.scrollPos;

        const isOutsideUp = (top - height <= scrollPos);
        const isOutsideDown = (top + height >= (scrollPos + containerHeight) - height);

        if (isOutsideDown) {
          return (top + height + height) - containerHeight;
        } else if (isOutsideUp) {
          return top - height;
        }

        // If it’s inside container do nothing at all
        return this.state.scrollPos;
      }

      // If nothing highlighted
      return this.state.scrollPos;
    }
    // Default value
    return undefined;
  };

  updateScrollPosition = (pos) => {
    this.setState({
      scrollPos: pos,
    });
  };

  render() {
    return (
      <CustomScroll
        ref={this.setScrollRef}
        scrollTo={this.state.scrollPos}
      >
        <div
          {...this.props.containerProps}
          className="Suggester-container"
        >
          {this.props.children}
        </div>
      </CustomScroll>
    );
  }
}

SuggesterContainer.propTypes = {
  containerProps: PropTypes.object,
  children: PropTypes.object,
};

export default SuggesterContainer;
