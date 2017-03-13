import React from 'react';
import { storiesOf } from '@kadira/storybook';

import '../src/core/styles/main.scss';
import PatchGroupItem from '../src/projectBrowser/components/PatchGroupItem';

storiesOf('PatchGroupItem', module)
  .add('default', () => (
    <div style={{ width: '200px', backgroundColor: 'tomato' }}>
      <PatchGroupItem label="Item 1" />
      <PatchGroupItem
        label="Item 2"
        hoverButtons={[
          <i className="fa fa-plus-circle hover-button" />,
        ]}
      />
      <PatchGroupItem label="Item with moderately big label" />
      <PatchGroupItem label="Item with a really big label that definitely won't fit" />
    </div>
  ));

