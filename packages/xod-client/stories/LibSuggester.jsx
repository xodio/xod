import React from 'react';
import { storiesOf } from '@storybook/react';

import LibSuggester from '../src/editor/components/LibSuggester';
import '../src/core/styles/main.scss';

storiesOf('LibSuggester', module)
  .addDecorator(story => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        background: '#676767',
      }}
    >
      {story()}
    </div>
  ))
  .add('basic', () => (
    <LibSuggester
      onInstallLibrary={lib => {
        // eslint-disable-next-line
        alert(`Library "${lib.owner}/${lib.libname}@${lib.version}" will be installed!`);
      }}
    />
  ));
