import React, { PropTypes } from 'react';
import Menu, { SubMenu, MenuItem, Divider } from 'rc-menu';

import { noop } from '../ramda';

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

  const labelPostfix = hotkey ? ` (${hotkey})` : '';

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

const Menubar = ({ items }) => (
  <Menu
    mode="horizontal"
    selectedKeys={[]}
    prefixCls="Menubar"
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
  hotkey: PropTypes.oneOfType([ // TODO: maybe convert it earlier?
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
});

Menubar.propTypes = {
  items: PropTypes.arrayOf(menuBarItemType),
};


export default Menubar;
