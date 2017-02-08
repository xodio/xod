import R from 'ramda';
import React, { PropTypes } from 'react';
import Menu, { SubMenu, MenuItem, Divider } from 'rc-menu';

import { noop } from '../ramda';

const renderMenuItem = (item) => {
  const {
    key, type,
    submenu,
    click,
    children,
    label, hotkey,
  } = item;

  if (type === 'separator') {
    return (
      <Divider key={key} />
    );
  }

  if (Array.isArray(submenu)) {
    return (
      <SubMenu key={key} title={<span>{label}</span>}>
        {R.map(renderMenuItem)(submenu)}
      </SubMenu>
    );
  }

  const labelPostfix = hotkey ? ` (${hotkey})` : '';

  return (
    <MenuItem key={key}>
      {/* because rc-menu does not support attaching callbacks directly to menu items */}
      {/* eslint-disable jsx-a11y/no-static-element-interactions */}
      <div onClick={click || noop}>
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
    {R.map(renderMenuItem)(items)}
  </Menu>
);

const menuBarItemType = PropTypes.shape({
  key: PropTypes.string.isRequired,
  label: PropTypes.string,
  children: PropTypes.element,
  type: PropTypes.oneOf(['separator']),
  // TODO: make proper recursive proptype? (see https://github.com/facebook/react/issues/5676)
  submenu: PropTypes.arrayOf(PropTypes.object),
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
