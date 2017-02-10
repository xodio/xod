import R from 'ramda';
import React, { PropTypes } from 'react';
import Menu, { SubMenu, MenuItem, Divider } from 'rc-menu';

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

  const labelPostfix = hotkey ? ` (${formatHotkey(hotkey)})` : '';

  return (
    <MenuItem key={key}>
      {/* because rc-menu does not support attaching callbacks directly to menu items */}
      {/* eslint-disable jsx-a11y/no-static-element-interactions */}
      <div onClick={click}>
        {
          children || (label + labelPostfix)
        }
      </div>
      {/* eslint-enable jsx-a11y/no-static-element-interactions */}
    </MenuItem>
  );
};

const Menubar = ({ items = [] }) => (
  <Menu
    mode="horizontal"
    selectedKeys={[]}
    prefixCls="Menubar"
    openSubMenuOnMouseEnter={false}
  >
    {items.map(renderMenubarItem)}
  </Menu>
);

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

Menubar.propTypes = {
  items: PropTypes.arrayOf(menuBarItemType),
};


export default Menubar;
