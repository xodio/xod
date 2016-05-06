import React from 'react';
import { Toolbar as RToolbar, NavItem, Space } from 'rebass';

export default class Toolbar extends React.Component {
  render() {
    return <RToolbar>
      <NavItem is="span">
        XOD
      </NavItem>
      <NavItem id="upload" is="a">
        Upload
      </NavItem>
      <Space
        auto={true}
        x={1}
      />
      <NavItem is="span">
        :)
      </NavItem>
    </RToolbar>;
  }
}
