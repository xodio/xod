import React from 'react';
import { storiesOf } from '@storybook/react';

import '../src/core/styles/main.scss';
import PatchGroup from '../src/projectBrowser/components/PatchGroup';

const ipsum = (
  <p style={{ color: '#CCC' }}>
    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus aperiam
    culpa deleniti eius eos incidunt labore magni minus neque obcaecati optio,
    possimus provident recusandae repellat vitae? Atque corporis excepturi
    neque.
  </p>
);

storiesOf('PatchGroup', module)
  .addDecorator(story => (
    <div style={{ height: '100vh', backgroundColor: 'tomato' }}>
      <p>some content to see the top border</p>
      {story()}
    </div>
  ))
  .add('library', () => (
    <PatchGroup name="Hello" type="library">
      {ipsum}
    </PatchGroup>
  ))
  .add('my', () => (
    <PatchGroup name="Hello" type="my">
      {ipsum}
    </PatchGroup>
  ))
  .add('several at once', () => (
    <div>
      <PatchGroup name="Group 1" type="my">
        {ipsum}
      </PatchGroup>
      <PatchGroup name="Group 2" type="library">
        {ipsum}
      </PatchGroup>
      <PatchGroup name="Group 3" type="library">
        {ipsum}
      </PatchGroup>
    </div>
  ));
