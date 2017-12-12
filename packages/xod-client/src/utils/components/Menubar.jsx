import R from 'ramda';
import React from 'react';
import cn from 'classnames';
import PropTypes from 'prop-types';
import Menu, { SubMenu, MenuItem, Divider } from 'rc-menu';

import { noop } from '../ramda';
import deepSCU from '../deepSCU';

const capitalize = R.compose(
  R.join(''),
  R.juxt([R.compose(R.toUpper, R.head), R.tail])
);

function formatHotkey(hotkeys) {
  if (Array.isArray(hotkeys)) {
    return R.compose(
      R.join(', '),
      R.map(formatHotkey)
    )(hotkeys);
  }

  return R.compose(
    R.join('+'),
    R.map(capitalize),
    R.split('+')
  )(hotkeys);
}

const noSelectedKeys = [];

const autoAdjustOverflow = {
  adjustX: 1,
  adjustY: 1,
};

const placements = {
  topLeft: {
    points: ['bl', 'tl'],
    overflow: autoAdjustOverflow,
    offset: [0, 0],
  },
  bottomLeft: {
    points: ['tl', 'bl'],
    overflow: autoAdjustOverflow,
    offset: [0, 0],
  },
  leftTop: {
    points: ['tr', 'tl'],
    overflow: autoAdjustOverflow,
    offset: [0, 0],
  },
  rightTop: {
    points: ['tl', 'tr'],
    overflow: autoAdjustOverflow,
    offset: [0, 0],
  },
};

class Menubar extends React.Component {
  constructor(props) {
    super(props);

    this.onOpenChange = this.onOpenChange.bind(this);
    this.closeAll = this.closeAll.bind(this);
    this.onTitleClick = this.onTitleClick.bind(this);

    this.renderMenubarItem = this.renderMenubarItem.bind(this);

    this.shouldComponentUpdate = deepSCU.bind(this);

    this.state = {
      openKeys: [],
      isOpen: false,
    };
  }

  onOpenChange(newOpenKeys) {
    const { isOpen, openKeys } = this.state;

    if (!isOpen) {
      this.setState({
        openKeys: newOpenKeys,
        isOpen: !R.isEmpty(newOpenKeys),
      });
    } else {
      this.setState({
        // do not allow to close all, only open something different
        openKeys: R.isEmpty(newOpenKeys) ? openKeys : R.difference(newOpenKeys, openKeys),
      });
    }
  }

  onTitleClick({ key }) {
    const isTopLevel = R.compose(
      R.contains(key),
      R.map(R.prop('key'))
    )(this.props.items);

    if (this.state.isOpen && isTopLevel) {
      this.closeAll();
    }
  }

  closeAll() {
    this.setState({
      openKeys: [],
      isOpen: false,
    });
  }

  renderMenubarItem(item, index) {
    const {
      key = index, // we can allow fallback to indices since we don't rearrange menu items
      type,
      submenu,
      enabled = true,
      click = noop,
      children,
      label,
      hotkey,
    } = item;

    if (type === 'separator') {
      return (
        <Divider key={key} />
      );
    }

    if (Array.isArray(submenu)) {
      return (
        <SubMenu
          key={key}
          title={<span>{label}</span>}
          disabled={!enabled}
          onTitleClick={this.onTitleClick}
        >
          {submenu.map(this.renderMenubarItem)}
        </SubMenu>
      );
    }

    return (
      <MenuItem key={key} disabled={!enabled}>
        {/* because rc-menu does not support attaching callbacks directly to menu items */}
        {/* eslint-disable jsx-a11y/no-static-element-interactions */}
        <div onClick={click} className="Menubar-clickable-item">
          { children || label }
          { hotkey && <div className="hotkey">{formatHotkey(hotkey)}</div> }
        </div>
        {/* eslint-enable jsx-a11y/no-static-element-interactions */}
      </MenuItem>
    );
  }

  render() {
    const { items } = this.props;
    const { isOpen, openKeys } = this.state;

    return (
      <React.Fragment>
        <Menu
          mode="horizontal"
          selectedKeys={noSelectedKeys}
          openKeys={openKeys}
          prefixCls="Menubar"
          triggerSubMenuAction={isOpen ? 'hover' : 'click'}
          subMenuOpenDelay={0}
          subMenuCloseDelay={0}
          onSelect={this.closeAll}
          onOpenChange={this.onOpenChange}
          popupPlacements={placements}
        >
          {items.map(this.renderMenubarItem)}
        </Menu>
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
          className={cn('MenuUnderlay', { isVisible: isOpen })}
          onClick={this.closeAll}
        />
      </React.Fragment>
    );
  }
}


// a trick to make recursive propType.
// see https://github.com/facebook/react/issues/5676
let menuBarItemType;
const lazyMenuBarItemType = (...args) => menuBarItemType(...args);

menuBarItemType = PropTypes.shape({
  key: PropTypes.string,
  label: PropTypes.string,
  children: PropTypes.element,
  type: PropTypes.oneOf(['separator']),
  submenu: PropTypes.arrayOf(lazyMenuBarItemType),
  click: PropTypes.func,
  hotkey: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
});

export const itemsPropTypes = PropTypes.arrayOf(menuBarItemType);

Menubar.propTypes = {
  items: itemsPropTypes,
};

Menubar.defaultProps = {
  items: [],
};


export default Menubar;
