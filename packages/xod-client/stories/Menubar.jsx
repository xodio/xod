import React from 'react';
import { storiesOf } from '@kadira/storybook';

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
        label: 'Parent',
        submenu: [
          { key: 1, label: 'Child 1' },
          { key: 2, label: 'Child 2' },
          { key: 3, label: 'Child 3' },
        ],
      },
    ];

    return <Menubar items={menuBarItems} />;
  });

