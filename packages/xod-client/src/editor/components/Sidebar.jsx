import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import SplitPane from 'react-split-pane';
import { noop } from 'xod-func-tools';

let containerRef;

const numToPx = size => `${size}px`;

const Sidebar = ({ getSize, onChange, children }) => {
  const size = getSize();
  const minSize = 200;
  const isResizable = containerRef && containerRef.clientHeight > minSize * 2;
  const isSizeFits =
    containerRef && containerRef.clientHeight - minSize >= size;
  const getSplitPaneSize = () => {
    if (size && isSizeFits) return numToPx(size);
    if (size && isResizable) return containerRef.clientHeight - minSize;
    return '50%';
  };

  return (
    <div
      className="Sidebar"
      ref={el => {
        containerRef = el;
      }}
    >
      <SplitPane
        primary="second"
        split="horizontal"
        defaultSize="50%"
        size={getSplitPaneSize()}
        onChange={onChange}
        minSize={minSize}
        maxSize={R.negate(minSize)}
        allowResize={isResizable}
      >
        {children}
      </SplitPane>
    </div>
  );
};

Sidebar.defaultProps = {
  getSize: noop,
  onChange: noop,
};

Sidebar.propTypes = {
  getSize: PropTypes.func,
  onChange: PropTypes.func,
  children: PropTypes.arrayOf(PropTypes.element),
};

export default Sidebar;
