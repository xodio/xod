import React from 'react';
import { storiesOf } from '@storybook/react';

import '../src/core/styles/main.scss';
import Menubar from '../src/utils/components/Menubar';

storiesOf('Menubar', module)
  .addDecorator(story => (
    <div
      style={{
        // to see white submenus
        background: 'lightblue',
        height: '100vh',
      }}
    >
      {story()}
    </div>
  ))
  .add('basic', () => {
    const menuBarItems = [
      { key: 1, label: 'Hello' },
      { key: 2, label: 'Menubar' },
    ];

    return <Menubar items={menuBarItems} />;
  })
  .add('with submenu', () => {
    const menuBarItems = [
      { key: 1, label: 'Hello' },
      {
        key: 2,
        label: 'Parent 1',
        submenu: [
          { key: 1, label: 'Child 1.1' },
          { key: 2, label: 'Child 1.2', hotkey: 'ctrl+alt+del' },
          { key: 3, type: 'separator' },
          { key: 4, label: 'Child 1.3' },
        ],
      },
      {
        key: 3,
        label: 'Parent 2',
        submenu: [
          { key: 1, label: 'Child 2.1' },
          { key: 2, label: 'Child 2.2' },
        ],
      },
    ];

    return <Menubar items={menuBarItems} />;
  });
