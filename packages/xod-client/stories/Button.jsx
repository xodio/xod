import React from 'react';
import { storiesOf } from '@storybook/react';

import '../src/core/styles/main.scss';

storiesOf('Button', module)
  .add('dark', () => <button className="Button">Cancel</button>)
  .add('dark — disabled', () => (
    <button className="Button" disabled>
      Cancel
    </button>
  ))
  .add('light', () => <button className="Button Button--light">Cancel</button>)
  .add('light — disabled', () => (
    <button className="Button Button--light" disabled>
      Cancel
    </button>
  ));
