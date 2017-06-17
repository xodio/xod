import R from 'ramda';
import React, { PropTypes } from 'react';
import Menu, { SubMenu, MenuItem, Divider } from 'rc-menu';
import enhanceWithClickOutside from 'react-click-outside';

import { noop } from '../ramda';

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

const renderMenubarItem = (item, index) => {
  const {
    key = index, // we can allow fallback to indices since we don't rearrange menu items
    type,
    submenu,
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
      <SubMenu key={key} title={<span>{label}</span>}>
        {submenu.map(renderMenubarItem)}
      </SubMenu>
    );
  }

  return (
    <MenuItem key={key}>
      {/* because rc-menu does not support attaching callbacks directly to menu items */}
      {/* eslint-disable jsx-a11y/no-static-element-interactions */}
      <div onClick={click} className="Menubar-clickable-item">
        { children || label }
        { hotkey && <div className="hotkey">{formatHotkey(hotkey)}</div> }
      </div>
      {/* eslint-enable jsx-a11y/no-static-element-interactions */}
    </MenuItem>
  );
};

class Menubar extends React.Component {
  constructor(props) {
    super(props);

    this.onOpenChange = this.onOpenChange.bind(this);
    this.closeAll = this.closeAll.bind(this);
    this.handleClickOutside = this.closeAll;

    this.state = {
      openKeys: [],
    };
  }

  onOpenChange(openKeys) {
    this.setState({
      openKeys,
    });
  }

  closeAll() {
    this.setState({
      openKeys: [],
    });
  }

  render() {
    const { items } = this.props;
    const { openKeys } = this.state;

    const isOpen = !!openKeys.length;

    return (
      <Menu
        mode="horizontal"
        selectedKeys={[]}
        openKeys={openKeys}
        prefixCls="Menubar"
        openSubMenuOnMouseEnter={isOpen}
        closeSubMenuOnMouseLeave={!isOpen}
        onSelect={this.closeAll}
        onOpenChange={this.onOpenChange}
      >
        {items.map(renderMenubarItem)}
      </Menu>
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


export default enhanceWithClickOutside(Menubar);
