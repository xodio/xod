import React from 'react';
import { storiesOf } from '@storybook/react';

import '../src/core/styles/main.scss';
import PatchTypeSelector from '../src/projectBrowser/components/PatchTypeSelector';

const selectedOptionsRenderer = selectedKey => `selected ${selectedKey}`;

storiesOf('PatchTypeSelector', module)
  .addDecorator(story => (
    <div style={{ width: 300 }}>
      <p>inside a 300px wide div:</p>
      {story()}
    </div>
  ))
  .add('default', () => (
    <PatchTypeSelector
      options={[
        { key: 'foo', name: 'Foo' },
        { key: 'bar', name: 'Bar' },
      ]}
    >
      {selectedOptionsRenderer}
    </PatchTypeSelector>
  ))
  .add('with initial selection', () => (
    <PatchTypeSelector
      options={[
        { key: 'foo', name: 'Foo' },
        { key: 'bar', name: 'Bar' },
        { key: 'baz', name: 'Baz' },
      ]}
      initialSelectedKey="bar"
    >
      {selectedOptionsRenderer}
    </PatchTypeSelector>
  ))
  .add('with no options', () => (
    <PatchTypeSelector
      options={[]}
    >
      {selectedOptionsRenderer}
    </PatchTypeSelector>
  ));

